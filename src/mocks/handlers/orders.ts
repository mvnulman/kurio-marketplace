import { http } from 'msw'

import type { CreateOrderInput } from '@/lib/contracts/orders'
import { IDEMPOTENCY_HEADER } from '@/lib/contracts/common'

import { requireUser } from '../db'
import { createOrder, findOrderForUser, listOrders } from '../domain/orders'
import { mockHandler, pathParam } from '../http/handler'
import { MockError, parseJson } from '../http/respond'
import { getScenario } from '../scenario'

export const orderHandlers = [
  http.post(
    '/api/orders',
    mockHandler('POST /orders', async ({ request }) => {
      const user = requireUser(request)
      const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim()
      if (!idempotencyKey) {
        throw new MockError(
          400,
          'VALIDATION_ERROR',
          'Cabeçalho Idempotency-Key é obrigatório para criar pedidos.',
        )
      }

      const input = await parseJson<CreateOrderInput>(request)
      const response = createOrder(input, {
        userId: user.id,
        request,
        idempotencyKey,
      })

      // Simula timeout depois que o pedido já foi persistido: repetir a mesma
      // chave de idempotência devolve o pedido criado.
      if (getScenario() === 'payment-timeout' && !response.replayed) {
        throw new MockError(
          504,
          'TIMEOUT',
          'Tempo esgotado ao confirmar o pagamento. Tente novamente para consultar o pedido.',
        )
      }

      return response
    }),
  ),

  http.get(
    '/api/orders',
    mockHandler('GET /orders', ({ request }) => {
      const user = requireUser(request)
      return { orders: listOrders(user.id) }
    }),
  ),

  http.get(
    '/api/orders/:orderId',
    mockHandler('GET /orders/:orderId', ({ request, params }) => {
      const user = requireUser(request)
      return findOrderForUser(user.id, pathParam({ request, params }, 'orderId'))
    }),
  ),
]
