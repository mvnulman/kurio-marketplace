import type {
  CatalogFilters,
  CatalogResponse,
  FavoritesResponse,
  NftDetailResponse,
} from '@/lib/contracts/catalog'
import { endpoints, http } from '@/lib/http'

function serializeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.q?.trim()) params.set('q', filters.q.trim())
  for (const category of filters.categories ?? []) params.append('category', category)
  for (const network of filters.networks ?? []) params.append('network', network)
  for (const collection of filters.collections ?? []) params.append('collection', collection)
  for (const rarity of filters.rarities ?? []) params.append('rarity', rarity)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  return params
}

export async function fetchCatalog(
  filters: CatalogFilters,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const { data } = await http.get<CatalogResponse>(endpoints.catalog.list, {
    params: serializeFilters(filters),
    signal,
  })
  return data
}

export async function fetchNft(nftId: string, signal?: AbortSignal): Promise<NftDetailResponse> {
  const { data } = await http.get<NftDetailResponse>(endpoints.catalog.detail(nftId), { signal })
  return data
}

export async function fetchFavorites(signal?: AbortSignal): Promise<FavoritesResponse> {
  const { data } = await http.get<FavoritesResponse>(endpoints.favorites.list, { signal })
  return data
}

export async function addFavorite(nftId: string): Promise<FavoritesResponse> {
  const { data } = await http.put<FavoritesResponse>(endpoints.favorites.item(nftId))
  return data
}

export async function removeFavorite(nftId: string): Promise<FavoritesResponse> {
  const { data } = await http.delete<FavoritesResponse>(endpoints.favorites.item(nftId))
  return data
}
