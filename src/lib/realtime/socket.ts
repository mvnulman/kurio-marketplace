import { io, type Socket } from 'socket.io-client'

import { env } from '@/lib/env'
import { sessionTokenStorage } from '@/lib/storage'

let socket: Socket | null = null

/**
 * Cliente Socket.IO do marketplace.
 *
 * `transports: ['websocket']` é obrigatório na demonstração: a simulação com
 * MSW intercepta apenas WebSockets, não o long-polling do engine.io.
 * O token de sessão viaja na query de handshake para o mock identificar o usuário.
 */
export function getSocket(): Socket {
  if (socket) return socket

  socket = io(env.socketUrl ?? window.location.origin, {
    transports: ['websocket'],
    path: '/socket.io',
    query: { token: sessionTokenStorage.get() ?? '' },
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
    timeout: 10_000,
  })

  return socket
}

export function updateSocketToken(token: string | null): void {
  const current = getSocket()
  if (current.io.opts.query === undefined) {
    current.io.opts.query = {}
  }
  ;(current.io.opts.query as Record<string, string>).token = token ?? ''

  if (current.disconnected) {
    current.connect()
  } else {
    current.disconnect()
    current.connect()
  }
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket?.removeAllListeners()
  socket = null
}
