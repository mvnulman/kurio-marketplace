import type {
  CatalogFilters,
  CatalogResponse,
  Nft,
  NftDetailResponse,
  NftRarity,
} from '@/lib/contracts/catalog'
import type { NetworkId } from '@/lib/contracts/common'
import { MAX_PAGE_SIZE } from '@/lib/contracts/common'
import type { NftUpdatedEvent } from '@/lib/contracts/realtime'
import { compareEth, dec } from '@/lib/money'

import { MockError, decorateNft, findNft, getDb, nowIso, saveDb } from '../db'
import { invalidateCartsWithNft } from './cart'
import { nextEventId, publishRealtime } from '../realtime/bus'
import { getScenario } from '../scenario'

const DEFAULT_PAGE_SIZE = 9

const RARITY_ORDER: Record<NftRarity, number> = {
  comum: 0,
  raro: 1,
  epico: 2,
  lendario: 3,
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function matchesSearch(nft: Nft, query: string): boolean {
  const haystack = normalize(
    `${nft.name} ${nft.collection.name} ${nft.creator.name} ${nft.attributes
      .map((attribute) => attribute.value)
      .join(' ')}`,
  )
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(normalize(term)))
}

function filterNfts(filters: CatalogFilters): Nft[] {
  let items = [...getDb().nfts]

  if (filters.q?.trim()) {
    const query = filters.q.trim()
    items = items.filter((nft) => matchesSearch(nft, query))
  }
  if (filters.categories?.length) {
    items = items.filter((nft) => filters.categories?.includes(nft.category))
  }
  if (filters.networks?.length) {
    items = items.filter((nft) => filters.networks?.includes(nft.network))
  }
  if (filters.collections?.length) {
    items = items.filter((nft) => filters.collections?.includes(nft.collection.id))
  }
  if (filters.rarities?.length) {
    items = items.filter((nft) => filters.rarities?.includes(nft.rarity))
  }
  if (filters.minPrice) {
    items = items.filter((nft) => compareEth(nft.priceEth, filters.minPrice ?? '0') >= 0)
  }
  if (filters.maxPrice) {
    items = items.filter((nft) => compareEth(nft.priceEth, filters.maxPrice ?? '0') <= 0)
  }

  return items
}

function sortNfts(items: Nft[], sort: CatalogFilters['sort']): Nft[] {
  const sorted = [...items]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.priceEth, b.priceEth))
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.priceEth, a.priceEth))
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    case 'rarity':
      return sorted.sort(
        (a, b) =>
          RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] ||
          compareEth(b.priceEth, a.priceEth),
      )
    case 'recent':
    default:
      return sorted.sort((a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt))
  }
}

export function listCatalog(filters: CatalogFilters, userId?: string): CatalogResponse {
  const all = getDb().nfts
  const filtered = getScenario() === 'empty' ? [] : filterNfts(filters)
  const sorted = sortNfts(filtered, filters.sort ?? 'recent')

  const requestedPage = Math.max(1, Math.floor(filters.page ?? 1))
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(filters.pageSize ?? DEFAULT_PAGE_SIZE)),
  )
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const start = (page - 1) * pageSize

  const collectionCounts = new Map<string, { label: string; count: number }>()
  const categoryCounts = new Map<string, number>()
  const networkCounts = new Map<NetworkId, number>()

  for (const nft of all) {
    const collection = collectionCounts.get(nft.collection.id)
    collectionCounts.set(nft.collection.id, {
      label: nft.collection.name,
      count: (collection?.count ?? 0) + 1,
    })
    categoryCounts.set(nft.category, (categoryCounts.get(nft.category) ?? 0) + 1)
    networkCounts.set(nft.network, (networkCounts.get(nft.network) ?? 0) + 1)
  }

  const priceMin = all.reduce(
    (min, nft) => (compareEth(nft.priceEth, min) < 0 ? nft.priceEth : min),
    '999999',
  )
  const priceMax = all.reduce(
    (max, nft) => (compareEth(nft.priceEth, max) > 0 ? nft.priceEth : max),
    '0',
  )

  return {
    items: sorted.slice(start, start + pageSize).map((nft) => decorateNft(nft, userId)),
    page,
    pageSize,
    total,
    totalPages,
    appliedSort: filters.sort ?? 'recent',
    facets: {
      collections: [...collectionCounts.entries()].map(([id, value]) => ({
        id,
        label: value.label,
        count: value.count,
      })),
      categories: [...categoryCounts.entries()].map(([id, count]) => ({
        id,
        label: id,
        count,
      })),
      networks: [...networkCounts.entries()].map(([id, count]) => ({
        id,
        label: id,
        count,
      })),
      priceRange: { min: priceMin, max: priceMax },
    },
  }
}

export function getNftDetail(nftId: string, userId?: string): NftDetailResponse {
  const nft = findNft(nftId)
  const related = getDb()
    .nfts.filter(
      (candidate) =>
        candidate.id !== nft.id &&
        (candidate.collection.id === nft.collection.id || candidate.creator.id === nft.creator.id),
    )
    .sort((a, b) => compareEth(a.priceEth, b.priceEth))
    .slice(0, 5)
    .map((candidate) => decorateNft(candidate, userId))

  return {
    nft: decorateNft(nft, userId),
    related,
    reviews: getDb().reviews[nft.id] ?? [],
  }
}

function publishNftEvent(nft: Nft, reason: NftUpdatedEvent['payload']['reason']): void {
  const event: NftUpdatedEvent = {
    id: nextEventId('nft'),
    type: 'nft.updated',
    resource: { kind: 'nft', id: nft.id },
    version: nft.version,
    emittedAt: nowIso(),
    payload: {
      nftId: nft.id,
      priceEth: nft.priceEth,
      available: nft.editions.available,
      isOpen: nft.editions.isOpen,
      reason,
      version: nft.version,
    },
  }
  publishRealtime(event)
}

export function changeNftPrice(nftId: string, priceEth: string, available?: number): Nft {
  const nft = findNft(nftId)
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(priceEth) || dec(priceEth).lessThanOrEqualTo(0)) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Preço inválido.', {
      fieldErrors: { priceEth: 'Informe um valor em ETH maior que zero.' },
    })
  }
  if (available !== undefined) {
    if (!Number.isInteger(available) || available < 0) {
      throw new MockError(400, 'VALIDATION_ERROR', 'Disponibilidade inválida.')
    }
    nft.editions.available = Math.min(nft.editions.total, available)
    nft.editions.minted = nft.editions.total - nft.editions.available
    nft.editions.isOpen = nft.editions.available > 0
  }

  nft.priceEth = priceEth
  nft.version += 1
  invalidateCartsWithNft(nft.id)
  saveDb()
  publishNftEvent(nft, nft.editions.available === 0 ? 'sold-out' : 'price-changed')
  return nft
}

export function sellOutNft(nftId: string): Nft {
  const nft = findNft(nftId)
  nft.editions.minted = nft.editions.total
  nft.editions.available = 0
  nft.editions.isOpen = false
  nft.version += 1
  invalidateCartsWithNft(nft.id)
  saveDb()
  publishNftEvent(nft, 'sold-out')
  return nft
}
