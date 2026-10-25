import type { EthAmount } from './common'

export interface CartItem {
  nftId: string
  name: string
  tokenId: string
  imageUrl: string
  quantity: number
  /** Preço unitário corrente, vindo do servidor. */
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
  available: number
  isAvailable: boolean
  version: number
}

export interface AppliedCoupon {
  code: string
  description: string
  kind: 'percent' | 'fixed'
  percent?: number
  amountEth?: EthAmount
  expiresAt: string
}

export interface Cart {
  id: string
  items: CartItem[]
  coupon: AppliedCoupon | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  /** Versão do carrinho; muda com itens, cupom e preços. */
  version: number
  updatedAt: string
}

export interface AddCartItemInput {
  nftId: string
  quantity: number
}

export interface UpdateCartItemInput {
  quantity: number
}

export interface ApplyCouponInput {
  code: string
}

export interface QuoteLine {
  nftId: string
  name: string
  tokenId: string
  imageUrl: string
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
  available: number
  isAvailable: boolean
}

export interface Quote {
  id: string
  cartId: string
  cartVersion: number
  lines: QuoteLine[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  coupon: AppliedCoupon | null
  issuedAt: string
  expiresAt: string
}

export interface QuoteResponse {
  quote: Quote
}

export interface CartResponse {
  cart: Cart
}
