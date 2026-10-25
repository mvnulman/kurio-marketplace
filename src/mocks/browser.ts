import { setupWorker } from 'msw/browser'

import { resetMockDb } from './db'
import { handlers } from './handlers'
import { socketHandlers } from './socket'
import { isMockScenario, setScenario } from './scenario'

export const worker = setupWorker(...handlers, ...socketHandlers)

/**
 * Inicia o Service Worker de mocks. Cenários podem ser selecionados via
 * `?scenario=slow` e os dados resetados com `?reset=1` — ambos documentados
 * no README e usados pelos testes E2E.
 */
export async function startMockWorker(): Promise<void> {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('scenario')

  if (isMockScenario(scenario)) {
    setScenario(scenario)
  }

  if (params.get('reset') === '1') {
    resetMockDb()
  }

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
