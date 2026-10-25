import { useQuery } from '@tanstack/react-query'

import { fetchCatalog, fetchNft } from '@/lib/api/catalog'
import type { CatalogFilters } from '@/lib/contracts/catalog'

function normalizeFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    categories: filters.categories?.length ? [...filters.categories].sort() : undefined,
    networks: filters.networks?.length ? [...filters.networks].sort() : undefined,
    collections: filters.collections?.length ? [...filters.collections].sort() : undefined,
    rarities: filters.rarities?.length ? [...filters.rarities].sort() : undefined,
    q: filters.q?.trim() || undefined,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 9,
    sort: filters.sort ?? 'recent',
  }
}

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (filters: CatalogFilters) => [...catalogKeys.lists(), normalizeFilters(filters)] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
}

export function useCatalogQuery(filters: CatalogFilters) {
  return useQuery({
    queryKey: catalogKeys.list(filters),
    queryFn: ({ signal }) => fetchCatalog(normalizeFilters(filters), signal),
  })
}

export function useNftDetailQuery(nftId: string) {
  return useQuery({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
    retry: (failureCount, error) => {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
        return false
      }
      return failureCount < 1
    },
  })
}
