import { useQuery } from '@tanstack/react-query'

import { fetchCart } from '@/lib/api/cart'
import type { Cart } from '@/lib/contracts/cart'

export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
  quote: () => [...cartKeys.all, 'quote'] as const,
}

export function useCartQuery() {
  return useQuery<Cart>({
    queryKey: cartKeys.detail(),
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 15_000,
  })
}

export function cartItemCount(cart: Cart | undefined): number {
  return cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
}
