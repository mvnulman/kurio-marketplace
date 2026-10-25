import type {
  AppliedCoupon,
  Cart,
  CartItem,
  Quote,
  QuoteLine,
} from '@/lib/contracts/cart'
import { addEth, mulEth, percentOf, subEth, sumLineTotals, toEthString, dec } from '@/lib/money'
import Decimal from 'decimal.js'

import { MockError, findNft, getDb, nowIso, saveDb, type CartRecord } from '../db'

/** Taxa de rede fixa por linha do carrinho (ETH). Documentada em ARCHITECTURE.md. */
export const NETWORK_FEE_PER_LINE_ETH = '0.008'
export const QUOTE_TTL_MS = 10 * 60 * 1000

interface CouponDefinition {
  code: string
  description: string
  kind: 'percent' | 'fixed'
  percent?: number
  amountEth?: string
  expiresAt: string
}

const COUPONS: Record<string, CouponDefinition> = {
  KURIO10: {
    code: 'KURIO10',
    description: '10% de desconto',
    kind: 'percent',
    percent: 10,
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  LAUNCH5: {
    code: 'LAUNCH5',
    description: 'Desconto de lançamento',
    kind: 'fixed',
    amountEth: '0.05',
    expiresAt: '2099-06-30T23:59:59.000Z',
  },
  EXPIRED10: {
    code: 'EXPIRED10',
    description: 'Cupom de campanha encerrada',
    kind: 'percent',
    percent: 10,
    expiresAt: '2020-01-01T00:00:00.000Z',
  },
}

export function getCartKey(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  const guestId = request.headers.get('X-Cart-Id')?.trim()
  if (!guestId) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Identificador do carrinho ausente.')
  }
  return `guest:${guestId}`
}

export function ensureCart(key: string): CartRecord {
  const existing = getDb().carts[key]
  if (existing) return existing

  const created: CartRecord = {
    key,
    items: [],
    couponCode: null,
    version: 1,
    updatedAt: nowIso(),
  }
  getDb().carts[key] = created
  saveDb()
  return created
}

function touch(record: CartRecord): void {
  record.version += 1
  record.updatedAt = nowIso()
  saveDb()
}

function findCoupon(code: string): CouponDefinition | undefined {
  return COUPONS[code.trim().toUpperCase()]
}

function resolveCoupon(code: string): AppliedCoupon {
  const coupon = findCoupon(code)
  if (!coupon) {
    throw new MockError(400, 'COUPON_INVALID', 'Código promocional inválido.', {
      fieldErrors: { code: 'Código promocional inválido.' },
    })
  }
  if (Date.parse(coupon.expiresAt) <= Date.now()) {
    throw new MockError(410, 'COUPON_EXPIRED', 'Este cupom expirou.', {
      fieldErrors: { code: 'Este cupom expirou.' },
    })
  }
  return {
    code: coupon.code,
    description: coupon.description,
    kind: coupon.kind,
    percent: coupon.percent,
    amountEth: coupon.amountEth,
    expiresAt: coupon.expiresAt,
  }
}

function activeCouponFor(record: CartRecord): AppliedCoupon | null {
  if (!record.couponCode) return null
  const coupon = findCoupon(record.couponCode)
  if (!coupon || Date.parse(coupon.expiresAt) <= Date.now()) return null
  return resolveCoupon(coupon.code)
}

function toCartItem(nftId: string, quantity: number): CartItem {
  const nft = findNft(nftId)
  const available = nft.editions.isOpen ? nft.editions.available : 0

  return {
    nftId: nft.id,
    name: nft.name,
    tokenId: nft.tokenId,
    imageUrl: nft.imageUrl,
    quantity,
    unitPriceEth: nft.priceEth,
    lineTotalEth: mulEth(nft.priceEth, quantity),
    available,
    isAvailable: available >= quantity,
    version: nft.version,
  }
}

export function buildCart(record: CartRecord): Cart {
  const items = record.items.map((item) => toCartItem(item.nftId, item.quantity))

  const subtotalEth = sumLineTotals(items)
  const coupon = activeCouponFor(record)
  const discountEth = coupon
    ? coupon.kind === 'percent'
      ? percentOf(subtotalEth, coupon.percent ?? 0)
      : toEthString(Decimal.min(dec(coupon.amountEth ?? '0'), dec(subtotalEth)))
    : '0'

  const networkFeeEth =
    items.length > 0 ? mulEth(NETWORK_FEE_PER_LINE_ETH, items.length) : '0'

  const totalEth = addEth(subEth(subtotalEth, discountEth), networkFeeEth)

  return {
    id: record.key,
    items,
    coupon,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    version: record.version,
    updatedAt: record.updatedAt,
  }
}

export function getCart(key: string): Cart {
  return buildCart(ensureCart(key))
}

function assertQuantity(quantity: unknown): asserts quantity is number {
  if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 99) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Informe uma quantidade entre 1 e 99.', {
      fieldErrors: { quantity: 'Informe uma quantidade entre 1 e 99.' },
    })
  }
}

export function addCartItem(key: string, nftId: string, quantity: number): Cart {
  const record = ensureCart(key)
  assertQuantity(quantity)
  const nft = findNft(nftId)

  if (!nft.editions.isOpen || nft.editions.available <= 0) {
    throw new MockError(409, 'OUT_OF_STOCK', 'Esta edição está esgotada.', {
      fieldErrors: { quantity: 'Edição esgotada.' },
    })
  }

  const existing = record.items.find((item) => item.nftId === nftId)
  const nextQuantity = (existing?.quantity ?? 0) + quantity

  if (nextQuantity > nft.editions.available) {
    throw new MockError(
      409,
      'OUT_OF_STOCK',
      `Restam apenas ${nft.editions.available} unidades desta edição.`,
      { fieldErrors: { quantity: 'Quantidade acima do disponível.' } },
    )
  }

  if (existing) {
    existing.quantity = nextQuantity
  } else {
    record.items.push({ nftId, quantity, addedAt: nowIso() })
  }

  touch(record)
  return buildCart(record)
}

export function updateCartItem(key: string, nftId: string, quantity: number): Cart {
  const record = ensureCart(key)
  const item = record.items.find((candidate) => candidate.nftId === nftId)
  if (!item) throw new MockError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')

  if (quantity === 0) {
    record.items = record.items.filter((candidate) => candidate.nftId !== nftId)
    touch(record)
    return buildCart(record)
  }

  assertQuantity(quantity)
  const nft = findNft(nftId)
  const available = nft.editions.isOpen ? nft.editions.available : 0

  if (quantity > available) {
    throw new MockError(
      409,
      'OUT_OF_STOCK',
      `Restam apenas ${available} unidades desta edição.`,
      { fieldErrors: { quantity: 'Quantidade acima do disponível.' } },
    )
  }

  item.quantity = quantity
  touch(record)
  return buildCart(record)
}

export function removeCartItem(key: string, nftId: string): Cart {
  const record = ensureCart(key)
  const nextItems = record.items.filter((item) => item.nftId !== nftId)
  if (nextItems.length === record.items.length) {
    throw new MockError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
  }
  record.items = nextItems
  touch(record)
  return buildCart(record)
}

export function applyCoupon(key: string, code: string): Cart {
  const record = ensureCart(key)
  const coupon = resolveCoupon(code)
  record.couponCode = coupon.code
  touch(record)
  return buildCart(record)
}

export function removeCoupon(key: string): Cart {
  const record = ensureCart(key)
  record.couponCode = null
  touch(record)
  return buildCart(record)
}

export function buildQuote(key: string): Quote {
  const cart = getCart(key)
  if (cart.items.length === 0) {
    throw new MockError(409, 'CONFLICT', 'Seu carrinho está vazio.')
  }

  const lines: QuoteLine[] = cart.items.map((item) => ({
    nftId: item.nftId,
    name: item.name,
    tokenId: item.tokenId,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPriceEth: item.unitPriceEth,
    lineTotalEth: item.lineTotalEth,
    available: item.available,
    isAvailable: item.isAvailable,
  }))

  const issuedAt = new Date()
  return {
    id: `quote_${cart.version}`,
    cartId: cart.id,
    cartVersion: cart.version,
    lines,
    subtotalEth: cart.subtotalEth,
    discountEth: cart.discountEth,
    networkFeeEth: cart.networkFeeEth,
    totalEth: cart.totalEth,
    coupon: cart.coupon,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + QUOTE_TTL_MS).toISOString(),
  }
}

/** Mescla o carrinho de visitante no carrinho do usuário ao autenticar. */
export function mergeGuestCart(request: Request, userId: string): void {
  const guestId = request.headers.get('X-Cart-Id')?.trim()
  if (!guestId) return

  const guestKey = `guest:${guestId}`
  const guestRecord = getDb().carts[guestKey]
  if (!guestRecord || guestRecord.items.length === 0) {
    delete getDb().carts[guestKey]
    saveDb()
    return
  }

  const userRecord = ensureCart(`user:${userId}`)
  let changed = false

  for (const guestItem of guestRecord.items) {
    const nft = getDb().nfts.find((candidate) => candidate.id === guestItem.nftId)
    if (!nft) continue
    const available = nft.editions.isOpen ? nft.editions.available : 0
    if (available <= 0) continue

    const existing = userRecord.items.find((item) => item.nftId === guestItem.nftId)
    const mergedQuantity = Math.min(
      available,
      (existing?.quantity ?? 0) + guestItem.quantity,
    )
    if (existing) {
      existing.quantity = mergedQuantity
    } else {
      userRecord.items.push({
        nftId: guestItem.nftId,
        quantity: mergedQuantity,
        addedAt: guestItem.addedAt,
      })
    }
    changed = true
  }

  delete getDb().carts[guestKey]

  if (changed) {
    userRecord.version += 1
    userRecord.updatedAt = nowIso()
  }
  saveDb()
}

/** Invalida cotações de carrinhos que contêm o NFT alterado. */
export function invalidateCartsWithNft(nftId: string): void {
  let changed = false
  for (const record of Object.values(getDb().carts)) {
    if (record.items.some((item) => item.nftId === nftId)) {
      record.version += 1
      record.updatedAt = nowIso()
      changed = true
    }
  }
  if (changed) saveDb()
}
