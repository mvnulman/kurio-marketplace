import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { CollectorDiary, FeaturedSection, PromoBanners } from '@/features/catalog/components/home-sections'
import { useCatalogQuery } from '@/features/catalog/queries'
import { catalogSearchSchema, filtersFromSearch } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: (search) => catalogSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: 'KURIO — Seja dono do futuro da arte digital' },
      {
        name: 'description',
        content:
          'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital verificada no marketplace KURIO.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const { q, cat, net, col, rar, min, max, sort, page } = search

  const filters = useMemo(
    () => filtersFromSearch({ q, cat, net, col, rar, min, max, sort, page }),
    [q, cat, net, col, rar, min, max, sort, page],
  )

  const catalog = useCatalogQuery(filters)

  return (
    <>
      <HomeHero />
      <CatalogSection
        search={search}
        data={catalog.data}
        error={catalog.error}
        isPending={catalog.isPending}
        isFetching={catalog.isFetching}
        isError={catalog.isError}
        onRetry={() => {
          void catalog.refetch()
        }}
      />
      <FeaturedSection nfts={catalog.data?.items ?? []} />
      <PromoBanners />
      <CollectorDiary />
    </>
  )
}
