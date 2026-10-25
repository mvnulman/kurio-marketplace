import type { Socket } from 'socket.io-client'

import { env } from '@/lib/env'
import { sessionTokenStorage } from '@/lib/storage'

let socket: Socket | null = null
let socketPromise: Promise<Socket> | null = null

function handshakeQuery(): Record<string, string> {
  const token = sessionTokenStorage.get()
  return token ? { token } : {}
}

/**
 * Cliente Socket.IO do marketplace, importado sob demanda.
 *
 * `transports: ['websocket']` é obrigatório na demonstração: a simulação com MSW
 * intercepta apenas WebSockets, não o long-polling do engine.io. O import dinâmico
 * garante que o engine.io capture o `WebSocket` global já interceptado pelo MSW
 * (no bundle estático, a referência era capturada antes da ativação do Service
 * Worker, derrubando o handshake).
 */
export async function getSocket(): Promise<Socket> {
  if (!socket) {
    socketPromise ??= (async () => {
      const { io } = await import('socket.io-client')
      return io(env.socketUrl ?? window.location.origin, {
        transports: ['websocket'],
        path: '/socket.io',
        query: handshakeQuery(),
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 4000,
        timeout: 10_000,
      })
    })()
    socket = await socketPromise
  }

  return socket
}

export async function updateSocketToken(token: string | null): Promise<void> {
  const current = await getSocket()
  const query = handshakeQuery()
  if (token) query.token = token
  current.io.opts.query = query

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
  socketPromise = null
}
