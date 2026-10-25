import type { Profile, Wallet } from '@/lib/contracts/account'
import type { AuthUser, Session } from '@/lib/contracts/auth'
import type { Nft, NftReview } from '@/lib/contracts/catalog'
import type { Order } from '@/lib/contracts/orders'
import type { ApiErrorCode } from '@/lib/contracts/common'

import { MockError } from './http/respond'
import { getScenario } from './scenario'
import { seedFavorites, seedProfiles, seedUsers, seedWallets, type SeedUser } from './fixtures/users'
import { seedNfts, seedReviews } from './fixtures/nfts'

const STORAGE_KEY = 'kurio:mock-db:v2'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export interface StoredOrder extends Order {
  userId: string
  cartId: string
  resolveAt: string
  forcedStatus: 'confirmed' | 'failed'
}

export interface CartItemRecord {
  nftId: string
  quantity: number
  addedAt: string
}

export interface CartRecord {
  key: string
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export interface MockDatabase {
  schemaVersion: 2
  nfts: Nft[]
  users: SeedUser[]
  sessions: Record<string, { userId: string; expiresAt: string }>
  carts: Record<string, CartRecord>
  favorites: Record<string, string[]>
  profiles: Record<string, Profile>
  wallets: Record<string, Wallet[]>
  orders: StoredOrder[]
  reviews: Record<string, NftReview[]>
  idempotency: Record<
    string,
    { userId: string; requestHash: string; orderId: string; createdAt: string }
  >
}

let database: MockDatabase | null = null

function createSeedDatabase(): MockDatabase {
  return {
    schemaVersion: 2,
    nfts: structuredClone(seedNfts),
    users: structuredClone(seedUsers),
    sessions: {},
    carts: {},
    favorites: structuredClone(seedFavorites),
    profiles: structuredClone(seedProfiles),
    wallets: structuredClone(seedWallets),
    orders: [],
    reviews: structuredClone(seedReviews),
    idempotency: {},
  }
}

function loadDatabase(): MockDatabase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedDatabase()
    const parsed = JSON.parse(raw) as Partial<MockDatabase>
    if (parsed.schemaVersion !== 2 || !Array.isArray(parsed.nfts)) {
      return createSeedDatabase()
    }
    const seed = createSeedDatabase()
    return { ...seed, ...parsed, schemaVersion: 2 }
  } catch {
    return createSeedDatabase()
  }
}

export function getDb(): MockDatabase {
  database ??= loadDatabase()
  return database
}

export function saveDb(): void {
  if (!database) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
  } catch {
    // Sem persistência disponível: os dados seguem válidos durante a sessão.
  }
}

export function resetMockDb(): void {
  database = createSeedDatabase()
  saveDb()
}

/* ------------------------------------------------------------------ */
/* Autenticação e sessão                                               */
/* ------------------------------------------------------------------ */

function extractToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export interface SessionLookup {
  token: string | null
  user: SeedUser | null
  reason?: Extract<ApiErrorCode, 'UNAUTHORIZED' | 'SESSION_EXPIRED'>
}

export function lookupSession(request: Request): SessionLookup {
  const token = extractToken(request)
  if (!token) return { token: null, user: null, reason: 'UNAUTHORIZED' }

  if (getScenario() === 'session-expired') {
    return { token, user: null, reason: 'SESSION_EXPIRED' }
  }

  const session = getDb().sessions[token]
  if (!session) return { token, user: null, reason: 'SESSION_EXPIRED' }
  if (Date.parse(session.expiresAt) <= Date.now()) {
    delete getDb().sessions[token]
    saveDb()
    return { token, user: null, reason: 'SESSION_EXPIRED' }
  }

  const user = getDb().users.find((candidate) => candidate.id === session.userId)
  if (!user) return { token, user: null, reason: 'SESSION_EXPIRED' }
  return { token, user }
}

/** Usuário autenticado opcional (ex.: favoritos na listagem pública). */
export function getSessionUser(request: Request): SeedUser | null {
  return lookupSession(request).user
}

/**
 * Para rotas que funcionam com ou sem sessão (ex.: carrinho de visitante):
 * ausência de token é permitida, token inválido/expirado não é.
 */
export function getOptionalUser(request: Request): SeedUser | null {
  const lookup = lookupSession(request)
  if (!lookup.token) return null
  if (!lookup.user) {
    throw new MockError(
      401,
      'SESSION_EXPIRED',
      'Sua sessão expirou. Entre novamente para continuar de onde parou.',
    )
  }
  return lookup.user
}

export function requireUser(request: Request): SeedUser {
  const lookup = lookupSession(request)
  if (lookup.user) return lookup.user

  if (lookup.reason === 'SESSION_EXPIRED') {
    throw new MockError(
      401,
      'SESSION_EXPIRED',
      'Sua sessão expirou. Entre novamente para continuar de onde parou.',
    )
  }
  throw new MockError(401, 'UNAUTHORIZED', 'Faça login para acessar este recurso.')
}

export function findUserByEmail(email: string): SeedUser | undefined {
  const normalized = email.trim().toLowerCase()
  return getDb().users.find((user) => user.email.toLowerCase() === normalized)
}

export function findUserByUsername(username: string): SeedUser | undefined {
  const normalized = username.trim().toLowerCase()
  return getDb().users.find((user) => user.username.toLowerCase() === normalized)
}

export function createSession(userId: string): Session {
  const token = `sess_${crypto.randomUUID().replace(/-/g, '')}`
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  getDb().sessions[token] = { userId, expiresAt }
  saveDb()

  const user = requireUserById(userId)
  return { token, expiresAt, user: toAuthUser(user) }
}

export function requireUserById(userId: string): SeedUser {
  const user = getDb().users.find((candidate) => candidate.id === userId)
  if (!user) throw new MockError(404, 'NOT_FOUND', 'Usuário não encontrado.')
  return user
}

export function deleteSession(token: string | null): void {
  if (!token) return
  delete getDb().sessions[token]
  saveDb()
}

/** Resolve o usuário a partir do token de sessão (usado no handshake do socket). */
export function getUserBySessionToken(token: string | null): SeedUser | null {
  if (!token) return null
  const session = getDb().sessions[token]
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  return getDb().users.find((candidate) => candidate.id === session.userId) ?? null
}

export function toAuthUser(user: SeedUser): AuthUser {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    ensName: user.ensName,
  }
}

export function expireAllSessions(): void {
  getDb().sessions = {}
  saveDb()
}

/* ------------------------------------------------------------------ */
/* Catálogo / favoritos                                                */
/* ------------------------------------------------------------------ */

export function findNft(nftId: string): Nft {
  const nft = getDb().nfts.find((candidate) => candidate.id === nftId)
  if (!nft) throw new MockError(404, 'NOT_FOUND', 'NFT não encontrado.')
  return nft
}

export function decorateNft(nft: Nft, userId?: string): Nft {
  if (!userId) return { ...nft, isFavorite: false }
  const favorites = getDb().favorites[userId] ?? []
  return { ...nft, isFavorite: favorites.includes(nft.id) }
}

export function getFavoriteIds(userId: string): string[] {
  return [...(getDb().favorites[userId] ?? [])]
}

export function setFavorite(userId: string, nftId: string, favorite: boolean): string[] {
  findNft(nftId)
  const favorites = new Set(getDb().favorites[userId] ?? [])
  if (favorite) favorites.add(nftId)
  else favorites.delete(nftId)
  getDb().favorites[userId] = [...favorites]
  saveDb()
  return [...favorites]
}

export function getReviews(nftId: string): NftReview[] {
  return getDb().reviews[nftId] ?? []
}

export function getProfileRecord(userId: string): Profile {
  const profile = getDb().profiles[userId]
  if (!profile) throw new MockError(404, 'NOT_FOUND', 'Perfil não encontrado.')
  return profile
}

export function getWalletRecords(userId: string): Wallet[] {
  return getDb().wallets[userId] ?? []
}

export function getUserRecord(userId: string): SeedUser {
  return requireUserById(userId)
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function nowIso(): string {
  return new Date().toISOString()
}

export function assertCondition(
  condition: unknown,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): asserts condition {
  if (!condition) throw new MockError(400, code, message, { fieldErrors: fields })
}

export { MockError }
