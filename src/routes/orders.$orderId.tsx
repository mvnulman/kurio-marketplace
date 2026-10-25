import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderDetailPlaceholder,
})

function OrderDetailPlaceholder() {
  return (
    <PagePlaceholder
      title="Confirmação do pedido"
      description="O recibo do pedido será exibido aqui após a implementação do checkout."
    />
  )
}
