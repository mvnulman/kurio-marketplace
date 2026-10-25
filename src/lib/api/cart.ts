import type {
  AddCartItemInput,
  Cart,
  CartResponse,
  Quote,
  QuoteResponse,
  UpdateCartItemInput,
} from '@/lib/contracts/cart'
import { endpoints, http } from '@/lib/http'

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await http.get<CartResponse>(endpoints.cart.root, { signal })
  return data.cart
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await http.post<CartResponse>(endpoints.cart.items, input)
  return data.cart
}

export async function updateCartItem(nftId: string, input: UpdateCartItemInput): Promise<Cart> {
  const { data } = await http.patch<CartResponse>(endpoints.cart.item(nftId), input)
  return data.cart
}

export async function removeCartItem(nftId: string): Promise<Cart> {
  const { data } = await http.delete<CartResponse>(endpoints.cart.item(nftId))
  return data.cart
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await http.post<CartResponse>(endpoints.cart.coupon, { code })
  return data.cart
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await http.delete<CartResponse>(endpoints.cart.coupon)
  return data.cart
}

export async function fetchQuote(signal?: AbortSignal): Promise<Quote> {
  const { data } = await http.get<QuoteResponse>(endpoints.cart.quote, { signal })
  return data.quote
}
