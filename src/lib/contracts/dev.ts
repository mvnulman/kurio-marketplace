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

export interface MockScenarioMeta {
  id: MockScenario
  label: string
  description: string
}

export const MOCK_SCENARIOS: ReadonlyArray<MockScenarioMeta> = [
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
    description:
      'O pedido é criado, mas a resposta falha; repetir com a mesma chave recupera o pedido.',
  },
]

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
