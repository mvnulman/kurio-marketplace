import { http } from 'msw'

import type { MockScenario } from '@/lib/contracts/dev'

import { expireAllSessions, getDb, resetMockDb } from '../db'
import { changeNftPrice, sellOutNft } from '../domain/catalog'
import { forceOrderStatus } from '../domain/orders'
import { mockHandler, pathParam } from '../http/handler'
import { MockError, parseJson } from '../http/respond'
import { SCENARIOS, getScenario, isMockScenario, setScenario } from '../scenario'

const SCENARIO_IDS = new Set(SCENARIOS.map((scenario) => scenario.id))

export const devHandlers = [
  http.post(
    '/api/dev/scenario',
    mockHandler('POST /dev/scenario', async ({ request }) => {
      const input = await parseJson<{ scenario: MockScenario }>(request)
      if (!isMockScenario(input.scenario) || !SCENARIO_IDS.has(input.scenario)) {
        throw new MockError(400, 'VALIDATION_ERROR', 'Cenário desconhecido.')
      }
      setScenario(input.scenario)
      return { scenario: getScenario() }
    }),
  ),

  http.post(
    '/api/dev/reset',
    mockHandler('POST /dev/reset', () => {
      resetMockDb()
      return { ok: true }
    }),
  ),

  http.get(
    '/api/dev/state',
    mockHandler('GET /dev/state', () => {
      const db = getDb()
      return {
        scenario: getScenario(),
        nftCount: db.nfts.length,
        users: db.users.length,
        orders: db.orders.length,
        carts: Object.keys(db.carts).length,
      }
    }),
  ),

  http.post(
    '/api/dev/nfts/:nftId/price',
    mockHandler('POST /dev/nfts/:nftId/price', async ({ request, params }) => {
      const input = await parseJson<{ priceEth: string; available?: number }>(request)
      return {
        nft: changeNftPrice(
          pathParam({ request, params }, 'nftId'),
          input.priceEth,
          input.available,
        ),
      }
    }),
  ),

  http.post(
    '/api/dev/nfts/:nftId/sold-out',
    mockHandler('POST /dev/nfts/:nftId/sold-out', ({ request, params }) => ({
      nft: sellOutNft(pathParam({ request, params }, 'nftId')),
    })),
  ),

  http.post(
    '/api/dev/orders/:orderId/resolve',
    mockHandler('POST /dev/orders/:orderId/resolve', async ({ request, params }) => {
      const input = await parseJson<{ status: 'confirmed' | 'failed' }>(request)
      return {
        order: forceOrderStatus(
          pathParam({ request, params }, 'orderId'),
          input.status === 'failed' ? 'failed' : 'confirmed',
        ),
      }
    }),
  ),

  http.post(
    '/api/dev/session/expire',
    mockHandler('POST /dev/session/expire', () => {
      expireAllSessions()
      return { ok: true }
    }),
  ),
]
