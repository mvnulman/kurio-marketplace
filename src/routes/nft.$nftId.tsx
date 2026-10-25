import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPlaceholder,
})

function NftDetailPlaceholder() {
  return (
    <PagePlaceholder
      title="Detalhes do NFT"
      description="Galeria, edições, favoritos e compra serão entregues na próxima etapa."
    />
  )
}
