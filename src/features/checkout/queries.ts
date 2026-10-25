import { useQuery } from '@tanstack/react-query'

import { fetchQuote } from '@/lib/api/cart'
import type { Quote } from '@/lib/contracts/cart'

import { cartKeys } from '@/features/cart/queries'

export function useQuoteQuery(options?: { refetchInterval?: number | false }) {
  return useQuery<Quote>({
    queryKey: [...cartKeys.quote()],
    queryFn: ({ signal }) => fetchQuote(signal),
    staleTime: 0,
    ...options,
  })
}
