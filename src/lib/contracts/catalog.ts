import type { EthAmount, NetworkId } from './common'

export type NftCategory =
  | 'arte-digital'
  | 'fotografia'
  | 'musica'
  | 'arte-3d'
  | 'colecionaveis'
  | 'generativa'
  | 'jogos'
  | 'assinaturas'
  | 'utilidade'

export const NFT_CATEGORIES: ReadonlyArray<{ id: NftCategory; label: string }> = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
]

export type NftRarity = 'comum' | 'raro' | 'epico' | 'lendario'

export const NFT_RARITIES: ReadonlyArray<{ id: NftRarity; label: string }> = [
  { id: 'comum', label: 'Comum' },
  { id: 'raro', label: 'Raro' },
  { id: 'epico', label: 'Épico' },
  { id: 'lendario', label: 'Lendário' },
]

export type NftSort = 'recent' | 'price-asc' | 'price-desc' | 'name-asc' | 'rarity'

export const NFT_SORTS: ReadonlyArray<{ id: NftSort; label: string }> = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
  { id: 'name-asc', label: 'Nome (A–Z)' },
  { id: 'rarity', label: 'Raridade' },
]

export interface NftAttribute {
  trait: string
  value: string
}

export interface NftCollectionRef {
  id: string
  name: string
  verified: boolean
}

export interface NftCreatorRef {
  id: string
  name: string
  verified: boolean
}

export interface NftEditions {
  /** Quantidade total emitida na edição. */
  total: number
  /** Unidades ainda disponíveis para compra. */
  available: number
  /** Unidades já vendidas. */
  minted: number
  isOpen: boolean
}

export interface Nft {
  id: string
  /** Identificador público do token (ex.: #0042). */
  tokenId: string
  name: string
  description: string
  imageUrl: string
  gallery: string[]
  priceEth: EthAmount
  network: NetworkId
  category: NftCategory
  collection: NftCollectionRef
  creator: NftCreatorRef
  editions: NftEditions
  rarity: NftRarity
  attributes: NftAttribute[]
  rating: { average: number; count: number }
  listedAt: string
  /** Incrementa a cada alteração vinda do servidor (preço/estoque). */
  version: number
  isFavorite?: boolean
}

export interface CatalogFacet {
  id: string
  label: string
  count: number
}

export interface CatalogFilters {
  q?: string
  categories?: NftCategory[]
  networks?: NetworkId[]
  collections?: string[]
  rarities?: NftRarity[]
  minPrice?: EthAmount
  maxPrice?: EthAmount
  sort?: NftSort
  page?: number
  pageSize?: number
}

export interface CatalogResponse {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  appliedSort: NftSort
  facets: {
    collections: CatalogFacet[]
    categories: CatalogFacet[]
    networks: CatalogFacet[]
    priceRange: { min: EthAmount; max: EthAmount }
  }
}

export interface NftDetailResponse {
  nft: Nft
  related: Nft[]
  reviews: NftReview[]
}

export interface NftReview {
  id: string
  author: string
  rating: number
  comment: string
  createdAt: string
}

export interface FavoritesResponse {
  ids: string[]
  items: Nft[]
}

export interface NftUpdatePayload {
  nftId: string
  priceEth: EthAmount
  available: number
  isOpen: boolean
  reason: 'price-changed' | 'sold-out' | 'restock' | 'purchase'
}
