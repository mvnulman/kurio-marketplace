import type { CreateOrderInput, Order, OrderCustomer, OrderItemSnapshot, OrderResponse } from '@/lib/contracts/orders'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/lib/contracts/realtime'
import type { Nft } from '@/lib/contracts/catalog'
import type { NetworkId } from '@/lib/contracts/common'
import { NETWORKS } from '@/lib/contracts/common'
import { WALLET_TYPES, type WalletType } from '@/lib/contracts/account'
import { mulEth } from '@/lib/money'

import { canonicalJson } from '../canonical-json'
import {
  MockError,
  findNft,
  getDb,
  getWalletRecords,
  nowIso,
  saveDb,
  type StoredOrder,
} from '../db'
import { nextEventId, publishRealtime } from '../realtime/bus'
import { getScenario } from '../scenario'
import { buildQuote, getCartKey, invalidateCartsWithNft } from './cart'

const RESOLUTION_DELAY_MS = 1800

export interface CreateOrderContext {
  userId: string
  request: Request
  idempotencyKey: string
}

function fakeTxHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`
}

function validateCustomer(customer: OrderCustomer): void {
  const fields: Record<string, string> = {}
  const displayName = customer.displayName?.trim() ?? ''
  const username = customer.username?.trim() ?? ''
  const email = customer.email?.trim() ?? ''
  const ensName = customer.ensName?.trim() ?? ''
  const walletNickname = customer.walletNickname?.trim() ?? ''

  if (displayName.length < 2 || displayName.length > 80) {
    fields.displayName = 'Informe um nome entre 2 e 80 caracteres.'
  }
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) {
    fields.username = 'Use de 3 a 24 caracteres (letras, números, ponto, hífen ou _).'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    fields.email = 'Informe um e-mail válido.'
  }
  if (!/^[a-zA-Z0-9-]{3,32}$/.test(ensName)) {
    fields.ensName = 'Informe um nome ENS válido (sem .eth).'
  }
  if (walletNickname.length < 2 || walletNickname.length > 40) {
    fields.walletNickname = 'Informe um apelido entre 2 e 40 caracteres.'
  }
  if (customer.observation && customer.observation.length > 500) {
    fields.observation = 'A observação deve ter no máximo 500 caracteres.'
  }

  if (Object.keys(fields).length > 0) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Revise os dados do colecionador.', {
      fieldErrors: fields,
    })
  }
}

function resolveWallet(
  userId: string,
  input: { useOtherWallet: boolean; walletId?: string; walletType: WalletType; walletAddress?: string },
): { label: string; type: WalletType } {
  if (input.useOtherWallet) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(input.walletAddress?.trim() ?? '')) {
      throw new MockError(400, 'VALIDATION_ERROR', 'Informe um endereço de carteira válido.', {
        fieldErrors: { walletAddress: 'Endereço deve ter 0x + 40 caracteres hexadecimais.' },
      })
    }
    return { label: 'Carteira externa', type: input.walletType }
  }

  const wallets = getWalletRecords(userId)
  const wallet = input.walletId
    ? wallets.find((candidate) => candidate.id === input.walletId)
    : wallets.find((candidate) => candidate.isPrimary)

  if (!wallet) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Selecione uma carteira cadastrada.', {
      fieldErrors: { walletId: 'Selecione uma carteira cadastrada.' },
    })
  }

  return { label: wallet.label, type: input.walletType }
}

function assertWalletType(value: unknown): asserts value is WalletType {
  if (!WALLET_TYPES.some((walletType) => walletType.id === value)) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Tipo de carteira inválido.', {
      fieldErrors: { walletType: 'Selecione um tipo de carteira.' },
    })
  }
}

function assertNetwork(value: unknown): asserts value is NetworkId {
  if (!NETWORKS.some((network) => network.id === value)) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Rede inválida.', {
      fieldErrors: { network: 'Selecione uma rede.' },
    })
  }
}

function settleOrder(order: StoredOrder, status: 'confirmed' | 'failed'): void {
  if (order.status !== 'pending') return

  const db = getDb()
  const updatedAt = nowIso()
  order.status = status
  order.updatedAt = updatedAt
  order.version += 1

  if (status === 'confirmed') {
    order.confirmedAt = updatedAt
    for (const item of order.items) {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
      if (nft) {
        nft.editions.minted = Math.min(nft.editions.total, nft.editions.minted + item.quantity)
      }
    }
    removePurchasedItemsFromCart(order)
  } else {
    order.failureReason = 'Pagamento recusado pela simulação.'
    for (const item of order.items) {
      const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
      if (!nft) continue
      nft.editions.available = Math.min(
        nft.editions.total,
        nft.editions.available + item.quantity,
      )
      nft.editions.minted = Math.max(0, nft.editions.minted - item.quantity)
      nft.editions.isOpen = true
      nft.version += 1
      publishNftUpdate(nft, 'restock')
    }
  }

  saveDb()
  publishOrderUpdate(order)
}

function removePurchasedItemsFromCart(order: StoredOrder): void {
  const cart = getDb().carts[order.cartId]
  if (!cart) return

  for (const purchased of order.items) {
    const item = cart.items.find((candidate) => candidate.nftId === purchased.nftId)
    if (!item) continue
    item.quantity -= purchased.quantity
    if (item.quantity <= 0) {
      cart.items = cart.items.filter((candidate) => candidate.nftId !== purchased.nftId)
    }
  }

  if (cart.items.length === 0) cart.couponCode = null
  cart.version += 1
  cart.updatedAt = nowIso()
}

function publishOrderUpdate(order: StoredOrder): void {
  const event: OrderUpdatedEvent = {
    id: nextEventId('order'),
    type: 'order.updated',
    resource: { kind: 'order', id: order.id },
    version: order.version,
    emittedAt: nowIso(),
    payload: {
      orderId: order.id,
      status: order.status,
      txHash: order.txHash,
      totalEth: order.totalEth,
      failureReason: order.failureReason,
      confirmedAt: order.confirmedAt,
    },
  }
  publishRealtime(event, { audienceUserId: order.userId })
}

function publishNftUpdate(nft: Nft, reason: NftUpdatedEvent['payload']['reason']): void {
  const event: NftUpdatedEvent = {
    id: nextEventId('nft'),
    type: 'nft.updated',
    resource: { kind: 'nft', id: nft.id },
    version: nft.version,
    emittedAt: nowIso(),
    payload: {
      nftId: nft.id,
      priceEth: nft.priceEth,
      available: nft.editions.available,
      isOpen: nft.editions.isOpen,
      reason,
      version: nft.version,
    },
  }
  publishRealtime(event)
}

export function toPublicOrder(order: StoredOrder): Order {
  const { userId: _userId, cartId: _cartId, resolveAt: _resolveAt, forcedStatus: _forced, ...rest } =
    order
  return rest
}

export function refreshPendingOrders(): void {
  const now = Date.now()
  const due = getDb().orders.filter(
    (order) => order.status === 'pending' && Date.parse(order.resolveAt) <= now,
  )
  for (const order of due) {
    settleOrder(order, order.forcedStatus)
  }
}

export function createOrder(input: CreateOrderInput, context: CreateOrderContext): OrderResponse {
  const db = getDb()
  const requestHash = canonicalJson(input)
  const existing = db.idempotency[context.idempotencyKey]

  if (existing) {
    if (existing.userId !== context.userId || existing.requestHash !== requestHash) {
      throw new MockError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'Esta chave de idempotência já foi usada com outro conteúdo.',
      )
    }
    const order = db.orders.find((candidate) => candidate.id === existing.orderId)
    if (!order) throw new MockError(404, 'NOT_FOUND', 'Pedido não encontrado.')
    return { order: toPublicOrder(order), replayed: true }
  }

  const cartKey = getCartKey(context.request, context.userId)
  const quote = buildQuote(cartKey)

  if (input.quoteId !== quote.id || input.cartVersion !== quote.cartVersion) {
    throw new MockError(
      409,
      'QUOTE_OUTDATED',
      'Os valores do carrinho mudaram. Revise a cotação antes de confirmar.',
      { meta: { quote } },
    )
  }

  const unavailable = quote.lines.filter((line) => !line.isAvailable || line.quantity > line.available)
  if (unavailable.length > 0) {
    throw new MockError(
      409,
      'OUT_OF_STOCK',
      'Um ou mais itens não estão mais disponíveis na quantidade escolhida.',
      {
        meta: { nftIds: unavailable.map((line) => line.nftId) },
      },
    )
  }

  validateCustomer(input.customer)
  assertWalletType(input.walletType)
  assertNetwork(input.network)
  const wallet = resolveWallet(context.userId, input)

  const items: OrderItemSnapshot[] = quote.lines.map((line) => ({
    nftId: line.nftId,
    name: line.name,
    tokenId: line.tokenId,
    imageUrl: line.imageUrl,
    quantity: line.quantity,
    unitPriceEth: line.unitPriceEth,
    lineTotalEth: mulEth(line.unitPriceEth, line.quantity),
  }))

  // Reserva o estoque antes de criar o pedido; falha devolve as unidades.
  for (const item of items) {
    const nft = findNft(item.nftId)
    if (nft.editions.available < item.quantity) {
      throw new MockError(409, 'OUT_OF_STOCK', `${nft.name} esgotou durante o checkout.`)
    }
    nft.editions.available -= item.quantity
    nft.editions.isOpen = nft.editions.available > 0
    nft.version += 1
    invalidateCartsWithNft(nft.id)
    publishNftUpdate(nft, nft.editions.available === 0 ? 'sold-out' : 'purchase')
  }

  const createdAt = nowIso()
  const order: StoredOrder = {
    id: `order_${crypto.randomUUID().slice(0, 8)}`,
    status: 'pending',
    txHash: fakeTxHash(),
    network: input.network,
    walletType: wallet.type,
    walletLabel: wallet.label,
    customer: input.customer,
    items,
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    couponCode: quote.coupon?.code,
    createdAt,
    updatedAt: createdAt,
    version: 1,
    userId: context.userId,
    cartId: cartKey,
    resolveAt: new Date(Date.now() + RESOLUTION_DELAY_MS).toISOString(),
    forcedStatus: getScenario() === 'payment-declined' ? 'failed' : 'confirmed',
  }

  db.orders.push(order)
  db.idempotency[context.idempotencyKey] = {
    userId: context.userId,
    requestHash,
    orderId: order.id,
    createdAt,
  }
  saveDb()

  window.setTimeout(() => {
    refreshPendingOrders()
  }, RESOLUTION_DELAY_MS + 100)

  return { order: toPublicOrder(order), replayed: false }
}

export function listOrders(userId: string): Order[] {
  refreshPendingOrders()
  return getDb()
    .orders.filter((order) => order.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toPublicOrder)
}

export function findOrderForUser(userId: string, orderId: string): Order {
  refreshPendingOrders()
  const order = getDb().orders.find(
    (candidate) => candidate.id === orderId && candidate.userId === userId,
  )
  if (!order) throw new MockError(404, 'NOT_FOUND', 'Pedido não encontrado.')
  return toPublicOrder(order)
}

export function forceOrderStatus(orderId: string, status: 'confirmed' | 'failed'): Order {
  const order = getDb().orders.find((candidate) => candidate.id === orderId)
  if (!order) throw new MockError(404, 'NOT_FOUND', 'Pedido não encontrado.')
  settleOrder(order, status)
  return toPublicOrder(order)
}
