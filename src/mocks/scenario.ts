import type { MockScenario } from '@/lib/contracts/dev'
import { MOCK_SCENARIOS } from '@/lib/contracts/dev'
import { scenarioStorage } from '@/lib/storage'

export const SCENARIOS = MOCK_SCENARIOS

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
