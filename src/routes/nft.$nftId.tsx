import { createFileRoute, Link } from '@tanstack/react-router'
import { PackageOpen } from 'lucide-react'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { ErrorState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftDetail } from '@/features/catalog/components/nft-detail'
import { useNftDetailQuery } from '@/features/catalog/queries'
import { isApiError } from '@/lib/http'

export const Route = createFileRoute('/nft/$nftId')({
  head: () => ({ meta: [{ title: 'Detalhes do NFT — KURIO' }] }),
  component: NftDetailPage,
})

function NftDetailSkeleton() {
  return (
    <div className="container-page py-6" aria-busy="true" aria-label="Carregando detalhes da obra">
      <Skeleton className="h-3 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="flex gap-2 md:flex-col">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="size-16 rounded-md" />
            ))}
          </div>
          <Skeleton className="aspect-square flex-1 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      {/* Reserva as seções inferiores (avaliações + relacionadas) para o
          rodapé já nascer fora da viewport — evita layout shift quando os
          dados chegam e a página cresce. */}
      <div className="mt-14 space-y-4" aria-hidden="true">
        <Skeleton className="h-3 w-56" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 space-y-4" aria-hidden="true">
        <Skeleton className="h-3 w-44" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-[210px] shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function NftNotFound() {
  return (
    <div className="container-page py-24 text-center">
      <PackageOpen className="text-muted-foreground mx-auto size-10" aria-hidden="true" />
      <p className="text-accent mt-4 text-[10px] tracking-[0.24em] uppercase">NFT não encontrado</p>
      <h1 className="mt-2 text-2xl font-bold">Esta obra não está mais disponível</h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm">
        O identificador acessado não existe no catálogo ou a obra foi removida pelo criador.
      </p>
      <Button asChild className="mt-6">
        <Link to="/" hash="catalogo">
          Explorar catálogo
        </Link>
      </Button>
    </div>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const query = useNftDetailQuery(nftId)

  if (query.isPending) return <NftDetailSkeleton />

  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) return <NftNotFound />

    return (
      <div className="container-page py-16">
        <ErrorState
          description={
            isApiError(query.error)
              ? query.error.message
              : 'Não foi possível carregar os detalhes desta obra.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      </div>
    )
  }

  const { nft, reviews, related } = query.data

  return (
    <>
      <div className="container-page pt-6">
        <Breadcrumbs
          items={[
            { label: 'Início', to: '/' },
            { label: 'Mercado', to: '/' },
            { label: nft.name },
          ]}
        />
      </div>
      <NftDetail nft={nft} reviews={reviews} related={related} />
    </>
  )
}
