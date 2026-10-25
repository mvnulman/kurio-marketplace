import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/profile/')({
  component: ProfilePlaceholder,
})

function ProfilePlaceholder() {
  return (
    <PagePlaceholder
      title="Perfil do colecionador"
      description="Dados do perfil, avatar e alteração de senha chegam na etapa de conta."
    />
  )
}
