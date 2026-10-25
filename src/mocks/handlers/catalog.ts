import { http } from 'msw'

import { NFT_CATEGORIES, NFT_RARITIES, NFT_SORTS } from '@/lib/contracts/catalog'
import type { CatalogFilters, NftCategory, NftRarity, NftSort } from '@/lib/contracts/catalog'
import { NETWORKS } from '@/lib/contracts/common'
import { isEthAmount } from '@/lib/money'

import { getSessionUser } from '../db'
import { getNftDetail, listCatalog } from '../domain/catalog'
import { mockHandler, pathParam } from '../http/handler'
import { MockError } from '../http/respond'

const CATEGORY_IDS = new Set(NFT_CATEGORIES.map((category) => category.id))
const RARITY_IDS = new Set(NFT_RARITIES.map((rarity) => rarity.id))
const SORT_IDS = new Set(NFT_SORTS.map((sort) => sort.id))
const NETWORK_IDS = new Set(NETWORKS.map((network) => network.id))

function parseFilters(url: URL): CatalogFilters {
  const params = url.searchParams
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(params.get('pageSize') ?? '9', 10)

  const filters: CatalogFilters = {
    q: params.get('q') ?? undefined,
    categories: params.getAll('category').filter((value): value is NftCategory => CATEGORY_IDS.has(value as NftCategory)),
    rarities: params.getAll('rarity').filter((value): value is NftRarity => RARITY_IDS.has(value as NftRarity)),
    networks: params.getAll('network').filter((value) => NETWORK_IDS.has(value as (typeof NETWORKS)[number]['id'])) as CatalogFilters['networks'],
    collections: params.getAll('collection'),
    sort: SORT_IDS.has(params.get('sort') as NftSort) ? (params.get('sort') as NftSort) : 'recent',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 9,
  }

  const minPrice = params.get('minPrice')
  const maxPrice = params.get('maxPrice')
  if (minPrice) {
    if (!isEthAmount(minPrice)) {
      throw new MockError(400, 'VALIDATION_ERROR', 'Preço mínimo inválido.', {
        fieldErrors: { minPrice: 'Informe um valor em ETH válido.' },
      })
    }
    filters.minPrice = minPrice
  }
  if (maxPrice) {
    if (!isEthAmount(maxPrice)) {
      throw new MockError(400, 'VALIDATION_ERROR', 'Preço máximo inválido.', {
        fieldErrors: { maxPrice: 'Informe um valor em ETH válido.' },
      })
    }
    filters.maxPrice = maxPrice
  }

  return filters
}

export const catalogHandlers = [
  http.get(
    '/api/nfts',
    mockHandler('GET /nfts', ({ request }) => {
      const filters = parseFilters(new URL(request.url))
      const user = getSessionUser(request)
      return listCatalog(filters, user?.id)
    }),
  ),

  http.get(
    '/api/nfts/:nftId',
    mockHandler('GET /nfts/:nftId', ({ request, params }) => {
      const user = getSessionUser(request)
      return getNftDetail(pathParam({ request, params }, 'nftId'), user?.id)
    }),
  ),
]
