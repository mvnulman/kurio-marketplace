import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { getUserBySessionToken } from './db'
import { subscribeRealtime } from './realtime/bus'

/**
 * Servidor Socket.IO simulado sobre a interceptação de WebSocket do MSW.
 *
 * Limitações (documentadas em ARCHITECTURE.md):
 * - o cliente é configurado com `transports: ['websocket']`, pois o binding
 *   não intercepta o transporte HTTP long-polling do engine.io;
 * - namespaces customizados e broadcast por salas não são suportados pelo wrapper.
 */
const socketLink = ws.link('/')

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const token = connection.client.url.searchParams.get('token')
    const user = getUserBySessionToken(token)

    const unsubscribe = subscribeRealtime((event, options) => {
      if (options.audienceUserId && options.audienceUserId !== user?.id) return
      io.client.emit(event.type, event)
    })

    // Responde ao ping do engine.io para manter a conexão viva.
    connection.client.addEventListener('message', (event) => {
      if (event.data === '2') {
        connection.client.send('3')
      }
    })

    connection.client.addEventListener('close', unsubscribe)
  }),
]
