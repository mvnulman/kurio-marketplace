import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/profile/wallets')({
  component: WalletsPlaceholder,
})

function WalletsPlaceholder() {
  return (
    <PagePlaceholder
      title="Carteiras"
      description="Cadastro e edição das carteiras principal e secundária chegam na etapa de conta."
    />
  )
}
