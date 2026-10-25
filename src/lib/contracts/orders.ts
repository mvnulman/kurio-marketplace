import type { EthAmount, NetworkId } from './common'
import type { WalletType } from './account'

export type OrderStatus = 'pending' | 'confirmed' | 'failed'

export interface OrderItemSnapshot {
  nftId: string
  name: string
  tokenId: string
  imageUrl: string
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
}

export interface OrderCustomer {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  observation?: string
}

export interface Order {
  id: string
  status: OrderStatus
  txHash: string
  network: NetworkId
  walletType: WalletType
  walletLabel: string
  customer: OrderCustomer
  items: OrderItemSnapshot[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  /** Total do snapshot: imutável após a criação do pedido. */
  totalEth: EthAmount
  couponCode?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  version: number
}

export interface CreateOrderInput {
  quoteId: string
  /** Versão da cotação revisada pelo usuário; divergência => QUOTE_OUTDATED. */
  cartVersion: number
  walletId?: string
  walletType: WalletType
  network: NetworkId
  useOtherWallet: boolean
  /** Endereço usado apenas quando `useOtherWallet` é verdadeiro. */
  walletAddress?: string
  customer: OrderCustomer
}

export interface OrderResponse {
  order: Order
  /** true quando a resposta veio do cache de idempotência. */
  replayed: boolean
}

export interface OrdersResponse {
  orders: Order[]
}
