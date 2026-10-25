import type { MockScenario, MockState } from '@/lib/contracts/dev'
import type { Nft } from '@/lib/contracts/catalog'
import { endpoints, http } from '@/lib/http'

export type { MockScenario, MockState }

export async function setScenario(scenario: MockScenario): Promise<{ scenario: MockScenario }> {
  const { data } = await http.post<{ scenario: MockScenario }>(endpoints.dev.scenario, { scenario })
  return data
}

export async function resetMocks(): Promise<{ ok: true }> {
  const { data } = await http.post<{ ok: true }>(endpoints.dev.reset)
  return data
}

export async function fetchMockState(): Promise<MockState> {
  const { data } = await http.get<MockState>(endpoints.dev.state)
  return data
}

export async function setNftPrice(
  nftId: string,
  priceEth: string,
  available?: number,
): Promise<{ nft: Nft }> {
  const { data } = await http.post<{ nft: Nft }>(endpoints.dev.nftPrice(nftId), {
    priceEth,
    available,
  })
  return data
}

export async function setNftSoldOut(nftId: string): Promise<{ nft: Nft }> {
  const { data } = await http.post<{ nft: Nft }>(endpoints.dev.nftSoldOut(nftId))
  return data
}

export async function expireSession(): Promise<void> {
  await http.post(endpoints.dev.expireSession)
}
