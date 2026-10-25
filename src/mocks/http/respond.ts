import { HttpResponse } from 'msw'

import type { ApiErrorCode, ApiErrorBody } from '@/lib/contracts/common'

export class MockError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fieldErrors: Record<string, string>
  readonly meta?: Record<string, unknown>

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: { fieldErrors?: Record<string, string>; meta?: Record<string, unknown> } = {},
  ) {
    super(message)
    this.name = 'MockError'
    this.status = status
    this.code = code
    this.fieldErrors = options.fieldErrors ?? {}
    this.meta = options.meta
  }

  toResponse(request: Request): Response {
    const body: ApiErrorBody = {
      code: this.code,
      message: this.message,
      requestId: request.headers.get('X-Request-Id') ?? undefined,
      ...(Object.keys(this.fieldErrors).length > 0 ? { fieldErrors: this.fieldErrors } : {}),
      ...(this.meta ? { meta: this.meta } : {}),
    }
    return HttpResponse.json(body, { status: this.status })
  }
}

/** Simula queda de conexão: o cliente recebe um erro de rede, não um HTTP status. */
export class MockNetworkError extends Error {
  constructor() {
    super('Falha de conexão simulada')
    this.name = 'MockNetworkError'
  }
}

export type MaybeResponse = Response | object

/**
 * Executa um handler e converte erros de domínio em respostas HTTP consistentes.
 * Centraliza o contrato de erro para todos os endpoints mockados.
 */
export async function respond(
  request: Request,
  handler: () => Promise<MaybeResponse> | MaybeResponse,
): Promise<Response> {
  try {
    const result = await handler()
    if (result instanceof Response) return result
    return HttpResponse.json(result as Record<string, unknown>)
  } catch (error) {
    if (error instanceof MockError) return error.toResponse(request)
    if (error instanceof MockNetworkError) return HttpResponse.error()
    throw error
  }
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new MockError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }
}
