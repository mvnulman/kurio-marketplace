import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPlaceholder,
})

function CheckoutPlaceholder() {
  return (
    <PagePlaceholder
      title="Pagamento"
      description="Perfil do colecionador, carteiras, cotação e envio do pedido chegam na etapa de checkout."
    />
  )
}
