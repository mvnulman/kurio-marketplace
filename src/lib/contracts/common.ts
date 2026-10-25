/** Valor monetário em ETH trafegado como string decimal (nunca `number`). */
export type EthAmount = string

export type NetworkId = 'ethereum' | 'polygon' | 'solana'

export const NETWORKS: ReadonlyArray<{ id: NetworkId; label: string }> = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
]

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'QUOTE_OUTDATED'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  /** Erros por campo, no formato esperado por formulários. */
  fieldErrors?: Record<string, string>
  requestId?: string
  /** Dados auxiliares para recuperação (ex.: cotação atualizada). */
  meta?: Record<string, unknown>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PageParams {
  page?: number
  pageSize?: number
}

/** Cabeçalho de idempotência exigido nas mutations de pedido. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
/** Identificador do carrinho de visitante (antes do login). */
export const GUEST_CART_HEADER = 'X-Cart-Id'

export const MAX_PAGE_SIZE = 24
