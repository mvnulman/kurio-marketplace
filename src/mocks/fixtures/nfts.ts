import type { Nft, NftCategory, NftRarity } from '@/lib/contracts/catalog'
import type { NetworkId } from '@/lib/contracts/common'
import type { NftReview } from '@/lib/contracts/catalog'

interface NftSeed {
  name: string
  priceEth: string
  collectionId: string
  category: NftCategory
  network: NetworkId
  rarity: NftRarity
  editions: number
  available?: number
  isOpen?: boolean
}

const COLLECTIONS = {
  'kurio-apes': { id: 'kurio-apes', name: 'Kurio Apes', verified: true },
  'neon-vessels': { id: 'neon-vessels', name: 'Neon Vessels', verified: true },
  'golden-beats': { id: 'golden-beats', name: 'Golden Beats', verified: false },
  'cosmic-bloom': { id: 'cosmic-bloom', name: 'Cosmic Bloom', verified: true },
} as const

const CREATORS = {
  ana: { id: 'creator-ana', name: 'Ana Kurio', verified: true },
  vega: { id: 'creator-vega', name: 'Studio Vega', verified: true },
  miro: { id: 'creator-miro', name: 'Miro Lume', verified: false },
  ona: { id: 'creator-ona', name: 'Ona Beats', verified: true },
  lia: { id: 'creator-lia', name: 'Lia Prisma', verified: false },
} as const

const SEEDS: NftSeed[] = [
  { name: 'Emerald Ape #042', priceEth: '1.19', collectionId: 'kurio-apes', category: 'colecionaveis', network: 'ethereum', rarity: 'epico', editions: 79 },
  { name: 'Sage Nomad #009', priceEth: '1.69', collectionId: 'kurio-apes', category: 'colecionaveis', network: 'ethereum', rarity: 'raro', editions: 60 },
  { name: 'Neon Vessel #552', priceEth: '1.99', collectionId: 'neon-vessels', category: 'arte-digital', network: 'polygon', rarity: 'raro', editions: 40 },
  { name: 'Cosmic Bloom #118', priceEth: '1.29', collectionId: 'cosmic-bloom', category: 'arte-digital', network: 'ethereum', rarity: 'comum', editions: 120 },
  { name: 'Violet Nomad #314', priceEth: '1.39', collectionId: 'kurio-apes', category: 'colecionaveis', network: 'ethereum', rarity: 'comum', editions: 120 },
  { name: 'Ivory Baron #088', priceEth: '1.79', collectionId: 'cosmic-bloom', category: 'arte-3d', network: 'ethereum', rarity: 'epico', editions: 35 },
  { name: 'Golden Beat #207', priceEth: '0.99', collectionId: 'golden-beats', category: 'musica', network: 'ethereum', rarity: 'comum', editions: 200 },
  { name: 'Golden Frequency #071', priceEth: '0.59', collectionId: 'golden-beats', category: 'musica', network: 'polygon', rarity: 'comum', editions: 200 },
  { name: 'Golden Signal #160', priceEth: '0.39', collectionId: 'golden-beats', category: 'musica', network: 'solana', rarity: 'comum', editions: 200 },
  { name: 'Monochrome Ape #023', priceEth: '2.29', collectionId: 'kurio-apes', category: 'fotografia', network: 'ethereum', rarity: 'raro', editions: 1, available: 0, isOpen: false },
  { name: 'Aurora Ape #311', priceEth: '3.4', collectionId: 'kurio-apes', category: 'generativa', network: 'ethereum', rarity: 'raro', editions: 25 },
  { name: 'Solar Ape #076', priceEth: '0.82', collectionId: 'kurio-apes', category: 'arte-digital', network: 'polygon', rarity: 'comum', editions: 150 },
  { name: 'Obsidian Ape #901', priceEth: '12.3', collectionId: 'kurio-apes', category: 'colecionaveis', network: 'ethereum', rarity: 'lendario', editions: 1 },
  { name: 'Cobalt Ape #442', priceEth: '4.75', collectionId: 'kurio-apes', category: 'arte-3d', network: 'ethereum', rarity: 'epico', editions: 12 },
  { name: 'Rose Ape #128', priceEth: '1.12', collectionId: 'kurio-apes', category: 'arte-digital', network: 'solana', rarity: 'comum', editions: 90 },
  { name: 'Jade Ape #064', priceEth: '2.05', collectionId: 'kurio-apes', category: 'generativa', network: 'ethereum', rarity: 'raro', editions: 45 },
  { name: 'Amber Ape #233', priceEth: '0.95', collectionId: 'kurio-apes', category: 'fotografia', network: 'polygon', rarity: 'comum', editions: 70 },
  { name: 'Silver Ape #517', priceEth: '1.55', collectionId: 'kurio-apes', category: 'jogos', network: 'ethereum', rarity: 'comum', editions: 100 },
  { name: 'Ember Ape #309', priceEth: '5.6', collectionId: 'kurio-apes', category: 'colecionaveis', network: 'ethereum', rarity: 'lendario', editions: 5 },
  { name: 'Frost Ape #712', priceEth: '0.72', collectionId: 'kurio-apes', category: 'assinaturas', network: 'solana', rarity: 'comum', editions: 40, available: 0, isOpen: false },
  { name: 'Dusk Vessel #188', priceEth: '1.45', collectionId: 'neon-vessels', category: 'arte-digital', network: 'ethereum', rarity: 'raro', editions: 30 },
  { name: 'Prism Vessel #621', priceEth: '2.85', collectionId: 'neon-vessels', category: 'generativa', network: 'polygon', rarity: 'epico', editions: 18 },
  { name: 'Terra Bloom #405', priceEth: '0.88', collectionId: 'cosmic-bloom', category: 'fotografia', network: 'ethereum', rarity: 'comum', editions: 80 },
  { name: 'Luna Vessel #950', priceEth: '3.15', collectionId: 'neon-vessels', category: 'utilidade', network: 'ethereum', rarity: 'raro', editions: 22 },
]

const CREATOR_BY_INDEX = [
  CREATORS.ana,
  CREATORS.vega,
  CREATORS.miro,
  CREATORS.lia,
  CREATORS.ona,
]

const TRAIT_POOL = {
  eyes: ['Olhos Esmeralda', 'Olhos Âmbar', 'Olhos Cristal', 'Olhos Noturnos'],
  outfit: ['Jaqueta Kurio', 'Moletom Violeta', 'Blazer Marfim', 'Fone Dourado'],
  accessory: ['Colar de Jade', 'Brinco de Ouro', 'Óculos de Sol', 'Corrente Prateada'],
  background: ['Areia', 'Névoa', 'Menta', 'Carvão'],
  aura: ['Equilíbrio', 'Impulso', 'Silêncio', 'Frequência'],
} as const

const BASE_DATE = Date.UTC(2026, 9, 20, 15, 0, 0)

function tokenIdFromName(name: string): string {
  return name.slice(name.indexOf('#') + 1)
}

function buildDescription(name: string, collectionName: string): string {
  return [
    `${name} é uma obra digital finalizada à mão da coleção ${collectionName}.`,
    'Cada edição carrega um registro permanente de autoria, procedência e histórico de propriedade.',
    'A arte explora a tensão entre natureza e tecnologia: um primata urbano, colecionador de memórias digitais, observa o próximo ciclo da cultura on-chain.',
  ].join(' ')
}

export const seedNfts: Nft[] = SEEDS.map((seed, index) => {
  const imageNumber = String(index + 1).padStart(2, '0')
  const imageUrl = `/assets/nfts/ape-${imageNumber}.webp`
  const gallery = [imageUrl, `/assets/nfts/ape-${String(((index + 4) % 24) + 1).padStart(2, '0')}.webp`, `/assets/nfts/ape-${String(((index + 9) % 24) + 1).padStart(2, '0')}.webp`, `/assets/nfts/ape-${String(((index + 14) % 24) + 1).padStart(2, '0')}.webp`]
  const collection = COLLECTIONS[seed.collectionId as keyof typeof COLLECTIONS]
  const total = seed.editions
  const available = seed.available ?? Math.max(1, Math.round(total * 0.72))
  const minted = total - available

  return {
    id: `nft-${imageNumber}`,
    tokenId: tokenIdFromName(seed.name),
    name: seed.name,
    description: buildDescription(seed.name.split(' #')[0] ?? seed.name, collection.name),
    imageUrl,
    gallery,
    priceEth: seed.priceEth,
    network: seed.network,
    category: seed.category,
    collection,
    creator: CREATOR_BY_INDEX[index % CREATOR_BY_INDEX.length] ?? CREATORS.ana,
    editions: {
      total,
      available,
      minted,
      isOpen: seed.isOpen ?? true,
    },
    rarity: seed.rarity,
    attributes: [
      { trait: 'Olhos', value: TRAIT_POOL.eyes[index % TRAIT_POOL.eyes.length] ?? 'Olhos Esmeralda' },
      { trait: 'Vestuário', value: TRAIT_POOL.outfit[index % TRAIT_POOL.outfit.length] ?? 'Jaqueta Kurio' },
      { trait: 'Acessório', value: TRAIT_POOL.accessory[index % TRAIT_POOL.accessory.length] ?? 'Colar de Jade' },
      { trait: 'Fundo', value: TRAIT_POOL.background[index % TRAIT_POOL.background.length] ?? 'Areia' },
      { trait: 'Aura', value: TRAIT_POOL.aura[index % TRAIT_POOL.aura.length] ?? 'Equilíbrio' },
    ],
    rating: {
      average: Number((4.6 + ((index * 7) % 4) / 10).toFixed(1)),
      count: 8 + ((index * 13) % 40),
    },
    listedAt: new Date(BASE_DATE - index * 36 * 60 * 60 * 1000).toISOString(),
    version: 1,
  }
})

export const seedReviews: Record<string, NftReview[]> = Object.fromEntries(
  seedNfts.map((nft, index) => [
    nft.id,
    [
      {
        id: `${nft.id}-review-1`,
        author: 'Marina C.',
        rating: 5,
        comment: 'A peça chegou com a proveniência impecável. A curadoria da coleção é excelente.',
        createdAt: new Date(BASE_DATE - index * 86400000 - 86400000).toISOString(),
      },
      {
        id: `${nft.id}-review-2`,
        author: 'Rafael T.',
        rating: 4,
        comment: 'Cores muito bem calibradas no perfil sRGB. Vale cada ETH.',
        createdAt: new Date(BASE_DATE - index * 86400000 - 4 * 86400000).toISOString(),
      },
      {
        id: `${nft.id}-review-3`,
        author: 'Joana P.',
        rating: 5,
        comment: 'Segunda obra que coleciono do criador. A consistência visual é rara.',
        createdAt: new Date(BASE_DATE - index * 86400000 - 9 * 86400000).toISOString(),
      },
    ],
  ]),
)

export const featuredNftIds = ['nft-01', 'nft-02', 'nft-03', 'nft-04', 'nft-05', 'nft-06']
