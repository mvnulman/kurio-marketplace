import { useNavigate } from '@tanstack/react-router'
import { Loader2, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

import { NftCard, NftCardSkeleton } from '@/components/common/nft-card'
import { EmptyState, ErrorState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { NFT_CATEGORIES, NFT_RARITIES, NFT_SORTS } from '@/lib/contracts/catalog'
import type { CatalogResponse } from '@/lib/contracts/catalog'
import { NETWORKS } from '@/lib/contracts/common'
import { isApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'

import type { CatalogSearch } from '../search'
import { parseCsv } from '../search'
import { CatalogFilters } from './catalog-filters'
import { Pagination } from './pagination'

type FacetGroup = 'cat' | 'net' | 'col' | 'rar'

interface CatalogSectionProps {
  search: CatalogSearch
  data: CatalogResponse | undefined
  error: unknown
  isPending: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
}

const CATEGORY_LABEL = new Map<string, string>(NFT_CATEGORIES.map((item) => [item.id, item.label]))
const RARITY_LABEL = new Map<string, string>(NFT_RARITIES.map((item) => [item.id, item.label]))

export function CatalogSection({
  search,
  data,
  error,
  isPending,
  isFetching,
  isError,
  onRetry,
}: CatalogSectionProps) {
  const navigate = useNavigate({ from: '/' })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filters = data?.facets

  function replaceSearch(next: Partial<CatalogSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...next }),
      resetScroll: false,
    })
  }

  function toggleFacet(group: FacetGroup, value: string) {
    const current = parseCsv(search[group])
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]

    replaceSearch({ [group]: next.length > 0 ? next.join(',') : undefined, page: undefined })
  }

  function changePrice(min: string | undefined, max: string | undefined) {
    replaceSearch({ min, max, page: undefined })
  }

  function clearFilters() {
    void navigate({ search: {}, resetScroll: false })
  }

  const activeFilterCount =
    parseCsv(search.cat).length +
    parseCsv(search.net).length +
    parseCsv(search.col).length +
    parseCsv(search.rar).length +
    (search.min || search.max ? 1 : 0) +
    (search.q ? 1 : 0)

  const chips: Array<{ key: string; label: string; remove: () => void }> = []

  if (search.q) {
    chips.push({
      key: 'q',
      label: `Busca: “${search.q}”`,
      remove: () => replaceSearch({ q: undefined, page: undefined }),
    })
  }
  for (const value of parseCsv(search.cat)) {
    chips.push({
      key: `cat-${value}`,
      label: CATEGORY_LABEL.get(value) ?? value,
      remove: () => toggleFacet('cat', value),
    })
  }
  for (const value of parseCsv(search.rar)) {
    chips.push({
      key: `rar-${value}`,
      label: RARITY_LABEL.get(value) ?? value,
      remove: () => toggleFacet('rar', value),
    })
  }
  for (const value of parseCsv(search.net)) {
    chips.push({
      key: `net-${value}`,
      label: NETWORKS.find((network) => network.id === value)?.label ?? value,
      remove: () => toggleFacet('net', value),
    })
  }
  for (const value of parseCsv(search.col)) {
    chips.push({
      key: `col-${value}`,
      label: filters?.collections.find((item) => item.id === value)?.label ?? value,
      remove: () => toggleFacet('col', value),
    })
  }
  if (search.min || search.max) {
    chips.push({
      key: 'price',
      label: `${search.min ? formatEth(search.min, { withSymbol: false }) : '0'} – ${
        search.max ? formatEth(search.max, { withSymbol: false }) : '∞'
      } ETH`,
      remove: () => replaceSearch({ min: undefined, max: undefined, page: undefined }),
    })
  }

  const sort = search.sort ?? 'recent'
  const total = data?.total ?? 0
  const page = data?.page ?? 1
  const pageSize = data?.pageSize ?? 9
  const totalPages = data?.totalPages ?? 1
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const filtersProps = {
    search,
    facets: filters,
    onToggle: toggleFacet,
    onPriceChange: changePrice,
    onClear: clearFilters,
  }

  return (
    <section id="catalogo" aria-labelledby="catalog-title" className="container-page mt-14 scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          {filters ? (
            <div className="sticky top-24">
              <CatalogFilters {...filtersProps} />
            </div>
          ) : (
            <div className="space-y-5" aria-hidden="true">
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-accent text-[10px] tracking-[0.2em] uppercase">Descubra</p>
              <h2 id="catalog-title" className="mt-1 text-lg font-bold tracking-tight">
                Todos os NFTs
              </h2>
              <p
                aria-live="polite"
                className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px]"
              >
                {isPending ? (
                  'Carregando obras…'
                ) : (
                  <>
                    {total > 0 ? `${from}–${to} de ${total} obras` : 'Nenhuma obra encontrada'}
                    {isFetching && !isPending ? (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                        atualizando
                      </span>
                    ) : null}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal aria-hidden="true" />
                Filtros
                {activeFilterCount > 0 ? (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[9px]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground hidden text-[10px] sm:inline">Ordenar:</span>
                <label htmlFor="catalog-sort" className="sr-only">
                  Ordenar resultados
                </label>
                <Select
                  value={sort}
                  onValueChange={(value) =>
                    replaceSearch({ sort: value as CatalogSearch['sort'], page: undefined })
                  }
                >
                  <SelectTrigger id="catalog-sort" className="h-9 w-[210px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NFT_SORTS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-[10px]">Filtros ativos:</span>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remover filtro ${chip.label}`}
                  className="border-border-soft bg-card hover:border-primary hover:text-accent inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition-colors"
                >
                  {chip.label}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-accent text-[10px] underline underline-offset-4"
              >
                Limpar tudo
              </button>
            </div>
          ) : null}

          <div className="mt-6">
            {isError && !data ? (
              <ErrorState
                description={
                  isApiError(error)
                    ? error.message
                    : 'O catálogo não respondeu. Verifique a conexão e tente novamente.'
                }
                onRetry={onRetry}
              />
            ) : isPending ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <NftCardSkeleton key={index} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                {isError ? (
                  <p
                    role="alert"
                    className="border-destructive/40 bg-destructive/5 text-destructive mb-4 rounded-md border px-3 py-2 text-[11px]"
                  >
                    Não foi possível atualizar os resultados.{' '}
                    <button type="button" className="underline" onClick={onRetry}>
                      Tentar novamente
                    </button>
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
                  {data.items.map((nft) => (
                    <NftCard key={nft.id} nft={nft} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => replaceSearch({ page: nextPage })}
                />
              </>
            ) : (
              <EmptyState
                title="Nenhum NFT encontrado"
                description="Ajuste a busca ou remova alguns filtros para ver outras obras do catálogo."
                actionLabel={activeFilterCount > 0 ? 'Limpar filtros' : undefined}
                onAction={activeFilterCount > 0 ? clearFilters : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" title="Filtros" description="Refine os resultados do catálogo" className="w-[88%] sm:max-w-sm">
          <div className="p-5">
            <CatalogFilters {...filtersProps} />
            <Button className="mt-6 w-full" onClick={() => setMobileFiltersOpen(false)}>
              Ver {total} resultado{total === 1 ? '' : 's'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

