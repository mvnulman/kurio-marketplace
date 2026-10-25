import { useQuery } from '@tanstack/react-query'

import { fetchQuote } from '@/lib/api/cart'
import type { Quote } from '@/lib/contracts/cart'

/**
 * Cotação "congelada" no momento em que o checkout abre: mudanças de preço/
 * estoque/cupom durante a revisão não são aplicadas silenciosamente — a
 * confirmação revalida no servidor e exige nova confirmação do usuário.
 */
export function useCheckoutQuoteQuery() {
  return useQuery<Quote>({
    queryKey: ['checkout', 'quote'],
    queryFn: ({ signal }) => fetchQuote(signal),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}
