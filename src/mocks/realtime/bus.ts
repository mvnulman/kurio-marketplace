import type { RealtimeEvent } from '@/lib/contracts/realtime'

export interface RealtimePublishOptions {
  /** Quando definido, apenas o socket deste usuário recebe o evento. */
  audienceUserId?: string
}

type Listener = (event: RealtimeEvent, options: RealtimePublishOptions) => void

const listeners = new Set<Listener>()

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishRealtime(
  event: RealtimeEvent,
  options: RealtimePublishOptions = {},
): void {
  for (const listener of listeners) {
    listener(event, options)
  }
}

let eventSequence = 0

export function nextEventId(prefix: string): string {
  eventSequence += 1
  return `${prefix}_${Date.now().toString(36)}_${eventSequence}`
}
