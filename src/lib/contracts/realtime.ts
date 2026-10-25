import type { EthAmount } from './common'
import type { NftUpdatePayload } from './catalog'
import type { OrderStatus } from './orders'

export type RealtimeResourceKind = 'nft' | 'order' | 'cart'

interface BaseEvent<TType extends string, TPayload> {
  /** Identidade estável do evento (deduplicação). */
  id: string
  type: TType
  /** Recurso afetado. */
  resource: { kind: RealtimeResourceKind; id: string }
  /** Versão monotônica do recurso; eventos antigos/duplicados são ignorados. */
  version: number
  emittedAt: string
  payload: TPayload
}

export type NftUpdatedEvent = BaseEvent<
  'nft.updated',
  NftUpdatePayload & { version: number }
>

export type OrderUpdatedEvent = BaseEvent<
  'order.updated',
  {
    orderId: string
    status: OrderStatus
    txHash: string
    totalEth: EthAmount
    failureReason?: string
    confirmedAt?: string
  }
>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export interface RealtimeHandshake {
  token?: string
}
