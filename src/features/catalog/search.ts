import { z } from 'zod'

import type { CatalogFilters, NftCategory, NftRarity, NftSort } from '@/lib/contracts/catalog'
import { NFT_CATEGORIES, NFT_RARITIES, NFT_SORTS } from '@/lib/contracts/catalog'
import { NETWORKS } from '@/lib/contracts/common'
import type { NetworkId } from '@/lib/contracts/common'

const SORT_IDS = NFT_SORTS.map((sort) => sort.id) as [NftSort, ...NftSort[]]

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  cat: z.string().optional().catch(undefined),
  net: z.string().optional().catch(undefined),
  col: z.string().optional().catch(undefined),
  rar: z.string().optional().catch(undefined),
  min: z.string().optional().catch(undefined),
  max: z.string().optional().catch(undefined),
  sort: z.enum(SORT_IDS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

const CATEGORY_IDS = new Set(NFT_CATEGORIES.map((category) => category.id))
const RARITY_IDS = new Set(NFT_RARITIES.map((rarity) => rarity.id))
const NETWORK_IDS = new Set(NETWORKS.map((network) => network.id))

export function parseCsv(value: string | undefined): string[] {
  if (!value) return []
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

export function filtersFromSearch(search: CatalogSearch): CatalogFilters {
  return {
    q: search.q || undefined,
    categories: parseCsv(search.cat).filter((value): value is NftCategory =>
      CATEGORY_IDS.has(value as NftCategory),
    ),
    rarities: parseCsv(search.rar).filter((value): value is NftRarity =>
      RARITY_IDS.has(value as NftRarity),
    ),
    networks: parseCsv(search.net).filter((value): value is NetworkId =>
      NETWORK_IDS.has(value as NetworkId),
    ),
    collections: parseCsv(search.col),
    minPrice: search.min,
    maxPrice: search.max,
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
    pageSize: 9,
  }
}

/** Mantém os parâmetros de busca limpos e determinísticos na URL. */
export function searchFromValues(values: {
  q?: string
  categories?: string[]
  networks?: string[]
  collections?: string[]
  rarities?: string[]
  minPrice?: string
  maxPrice?: string
  sort?: NftSort
  page?: number
}): CatalogSearch {
  const toCsv = (items?: string[]) => (items && items.length > 0 ? items.join(',') : undefined)
  return {
    q: values.q?.trim() || undefined,
    cat: toCsv(values.categories),
    net: toCsv(values.networks),
    col: toCsv(values.collections),
    rar: toCsv(values.rarities),
    min: values.minPrice || undefined,
    max: values.maxPrice || undefined,
    sort: values.sort && values.sort !== 'recent' ? values.sort : undefined,
    page: values.page && values.page > 1 ? values.page : undefined,
  }
}
