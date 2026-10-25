import { delay, HttpResponse } from 'msw'

import { getScenario, latencyForScenario, shouldFailOnce } from '../scenario'
import { MockError, MockNetworkError, respond, type MaybeResponse } from './respond'

export interface MockInfo {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}

type Resolver = (info: MockInfo) => Promise<MaybeResponse> | MaybeResponse

/**
 * Envolve um resolver de domínio com latência, falhas de rede e respostas de erro
 * padronizadas. Todos os handlers mockados passam por aqui para que os cenários
 * (`slow`, `flaky`, `offline`, ...) tenham comportamento uniforme.
 */
export function mockHandler(key: string, resolver: Resolver) {
  return async (info: MockInfo): Promise<Response> => {
    await delay(latencyForScenario())

    if (getScenario() === 'offline') {
      return HttpResponse.error()
    }
    if (shouldFailOnce(key)) {
      return new MockError(
        503,
        'SERVER_ERROR',
        'Serviço temporariamente indisponível. Tente novamente.',
      ).toResponse(info.request)
    }

    return respond(info.request, () => resolver(info))
  }
}

export function pathParam(info: MockInfo, name: string): string {
  const value = info.params[name]
  if (typeof value === 'string' && value.length > 0) return decodeURIComponent(value)
  throw new MockError(400, 'VALIDATION_ERROR', `Parâmetro "${name}" inválido.`)
}

export { MockError, MockNetworkError }
