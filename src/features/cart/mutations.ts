import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addCartItem, applyCoupon, removeCartItem, removeCoupon, updateCartItem } from '@/lib/api/cart'
import type { Cart } from '@/lib/contracts/cart'

import { cartKeys } from './queries'

function useCartMutation<Variables>(mutationFn: (variables: Variables) => Promise<Cart>) {
  const queryClient = useQueryClient()

  return useMutation<Cart, unknown, Variables>({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(), cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.quote() })
    },
  })
}

export function useAddToCart() {
  return useCartMutation<Parameters<typeof addCartItem>[0]>((input) => addCartItem(input))
}

export function useUpdateCartItem() {
  return useCartMutation<{ nftId: string; quantity: number }>((input) =>
    updateCartItem(input.nftId, { quantity: input.quantity }),
  )
}

export function useRemoveCartItem() {
  return useCartMutation<{ nftId: string }>((input) => removeCartItem(input.nftId))
}

export function useApplyCoupon() {
  return useCartMutation<{ code: string }>((input) => applyCoupon(input.code))
}

export function useRemoveCoupon() {
  return useCartMutation<void>(() => removeCoupon())
}
