import { createFileRoute } from '@tanstack/react-router'

import { requireSession } from '@/features/auth/guards'
import { CheckoutPage } from '@/features/checkout/checkout-page'

export const Route = createFileRoute('/checkout')({
  beforeLoad: ({ location }) => requireSession(location),
  head: () => ({ meta: [{ title: 'Pagamento — KURIO' }] }),
  component: CheckoutPage,
})
