import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/cart')({
  component: CartPlaceholder,
})

function CartPlaceholder() {
  return (
    <PagePlaceholder
      title="Carrinho de NFTs"
      description="Quantidades, cupom e resumo da compra serão entregues na etapa de carrinho."
    />
  )
}
