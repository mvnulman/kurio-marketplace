import { http } from 'msw'

import type { AddCartItemInput, ApplyCouponInput, UpdateCartItemInput } from '@/lib/contracts/cart'

import { getOptionalUser } from '../db'
import {
  addCartItem,
  applyCoupon,
  buildQuote,
  getCart,
  getCartKey,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '../domain/cart'
import { mockHandler, pathParam } from '../http/handler'
import { parseJson } from '../http/respond'

export const cartHandlers = [
  http.get(
    '/api/cart',
    mockHandler('GET /cart', ({ request }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      return { cart: getCart(key) }
    }),
  ),

  http.post(
    '/api/cart/items',
    mockHandler('POST /cart/items', async ({ request }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      const input = await parseJson<AddCartItemInput>(request)
      return { cart: addCartItem(key, input.nftId, input.quantity) }
    }),
  ),

  http.patch(
    '/api/cart/items/:nftId',
    mockHandler('PATCH /cart/items/:nftId', async ({ request, params }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      const input = await parseJson<UpdateCartItemInput>(request)
      return {
        cart: updateCartItem(
          key,
          pathParam({ request, params }, 'nftId'),
          input.quantity,
        ),
      }
    }),
  ),

  http.delete(
    '/api/cart/items/:nftId',
    mockHandler('DELETE /cart/items/:nftId', ({ request, params }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      return { cart: removeCartItem(key, pathParam({ request, params }, 'nftId')) }
    }),
  ),

  http.post(
    '/api/cart/coupon',
    mockHandler('POST /cart/coupon', async ({ request }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      const input = await parseJson<ApplyCouponInput>(request)
      return { cart: applyCoupon(key, input.code) }
    }),
  ),

  http.delete(
    '/api/cart/coupon',
    mockHandler('DELETE /cart/coupon', ({ request }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      return { cart: removeCoupon(key) }
    }),
  ),

  http.get(
    '/api/cart/quote',
    mockHandler('GET /cart/quote', ({ request }) => {
      const user = getOptionalUser(request)
      const key = getCartKey(request, user?.id)
      return { quote: buildQuote(key) }
    }),
  ),
]
