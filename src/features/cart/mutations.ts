import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addCartItem } from '@/lib/api/cart'
import type { AddCartItemInput, Cart } from '@/lib/contracts/cart'

import { cartKeys } from './queries'

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation<Cart, unknown, AddCartItemInput>({
    mutationFn: (input) => addCartItem(input),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail(), cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.quote() })
    },
  })
}
