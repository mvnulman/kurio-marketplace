import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/orders/')({
  component: OrdersPlaceholder,
})

function OrdersPlaceholder() {
  return (
    <PagePlaceholder
      title="Meus pedidos"
      description="O histórico de pedidos será exibido aqui após a implementação do checkout."
    />
  )
}
