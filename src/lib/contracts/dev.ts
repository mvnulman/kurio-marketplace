export type MockScenario =
  | 'default'
  | 'slow'
  | 'variable'
  | 'flaky'
  | 'offline'
  | 'empty'
  | 'session-expired'
  | 'payment-declined'
  | 'payment-timeout'

export interface MockState {
  scenario: MockScenario
  nftCount: number
  users: number
  orders: number
  carts: number
}

export interface SetScenarioInput {
  scenario: MockScenario
}
