import type { MockScenario } from '@/lib/contracts/dev'
import { scenarioStorage } from '@/lib/storage'

export const SCENARIOS: ReadonlyArray<{
  id: MockScenario
  label: string
  description: string
}> = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'Latência curta, tudo funcionando. Cenário usado nas auditorias.',
  },
  {
    id: 'slow',
    label: 'Conexão lenta',
    description: 'Toda requisição leva ~1,5s — útil para inspecionar skeletons.',
  },
  {
    id: 'variable',
    label: 'Latência variável',
    description: 'Respostas chegam fora de ordem (250ms / 700ms / 1,2s em ciclo).',
  },
  {
    id: 'flaky',
    label: 'Falhas intermitentes',
    description: 'A primeira chamada de cada endpoint falha com 503; a repetição funciona.',
  },
  {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Todas as requisições falham como erro de rede.',
  },
  {
    id: 'empty',
    label: 'Catálogo vazio',
    description: 'A listagem retorna zero resultados para exercitar o estado vazio.',
  },
  {
    id: 'session-expired',
    label: 'Sessão expirada',
    description: 'Rotas autenticadas respondem 401 até novo login.',
  },
  {
    id: 'payment-declined',
    label: 'Pagamento recusado',
    description: 'O pedido é criado e a simulação de pagamento o recusa.',
  },
  {
    id: 'payment-timeout',
    label: 'Timeout no pedido',
    description: 'O pedido é criado, mas a resposta falha; repetir com a mesma chave recupera o pedido.',
  },
]

const VALID: ReadonlySet<string> = new Set(SCENARIOS.map((scenario) => scenario.id))

export function isMockScenario(value: string | null | undefined): value is MockScenario {
  return typeof value === 'string' && VALID.has(value)
}

export function getScenario(): MockScenario {
  const stored = scenarioStorage.get()
  return isMockScenario(stored) ? stored : 'default'
}

export function setScenario(scenario: MockScenario): void {
  scenarioStorage.set(scenario)
  faultRegistry.reset()
  requestCounter.reset()
}

const requestCounter = (() => {
  let count = 0
  return {
    next: () => {
      count += 1
      return count
    },
    reset: () => {
      count = 0
    },
  }
})()

const faultRegistry = (() => {
  const seen = new Set<string>()
  return {
    has: (key: string) => seen.has(key),
    mark: (key: string) => seen.add(key),
    reset: () => seen.clear(),
  }
})()

/** Falha determinística: cada endpoint falha uma única vez no cenário `flaky`. */
export function shouldFailOnce(key: string): boolean {
  if (getScenario() !== 'flaky') return false
  if (faultRegistry.has(key)) return false
  faultRegistry.mark(key)
  return true
}

/** Latência simulada por cenário, em milissegundos. */
export function latencyForScenario(): number {
  switch (getScenario()) {
    case 'slow':
      return 1500
    case 'variable': {
      const cycle = requestCounter.next() % 3
      return [250, 700, 1200][cycle] ?? 250
    }
    default:
      return 90 + (requestCounter.next() % 4) * 40
  }
}
