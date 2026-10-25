import axios, { type AxiosProgressEvent, type InternalAxiosRequestConfig } from 'axios'

import type { ApiErrorBody, ApiErrorCode } from '@/lib/contracts/common'
import { env } from '@/lib/env'
import { guestCartStorage, sessionTokenStorage } from '@/lib/storage'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly meta: Record<string, unknown>
  readonly requestId?: string

  constructor(
    message: string,
    options: {
      code: ApiErrorCode
      status: number
      fieldErrors?: Record<string, string>
      meta?: Record<string, unknown>
      requestId?: string
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
    this.meta = options.meta ?? {}
    this.requestId = options.requestId
  }
}

type UnauthorizedHandler = (error: ApiError) => void
let unauthorizedHandler: UnauthorizedHandler | null = null

/** Registrado pelo AuthProvider: limpa caches privados e redireciona ao login. */
export function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = sessionTokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Cart-Id'] = guestCartStorage.get()
  config.headers['X-Request-Id'] = crypto.randomUUID()
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const normalized = normalizeError(error)
    if (normalized.status === 401) {
      unauthorizedHandler?.(normalized)
    }
    return Promise.reject(normalized)
  },
)

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as Partial<ApiErrorBody> | undefined

    if (error.code === 'ECONNABORTED') {
      return new ApiError('A requisição demorou demais. Tente novamente.', {
        code: 'TIMEOUT',
        status: 0,
        requestId: getRequestId(error.config),
      })
    }

    if (!error.response) {
      return new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', {
        code: 'NETWORK_ERROR',
        status: 0,
        requestId: getRequestId(error.config),
      })
    }

    if (body && typeof body.code === 'string') {
      return new ApiError(body.message ?? 'Não foi possível concluir a operação.', {
        code: body.code,
        status,
        fieldErrors: body.fieldErrors,
        meta: body.meta,
        requestId: body.requestId ?? getRequestId(error.config),
      })
    }

    return new ApiError('Erro inesperado no servidor. Tente novamente.', {
      code: 'SERVER_ERROR',
      status,
      requestId: getRequestId(error.config),
    })
  }

  return new ApiError('Erro inesperado. Tente novamente.', { code: 'SERVER_ERROR', status: 0 })
}

function getRequestId(config: InternalAxiosRequestConfig | undefined): string | undefined {
  const header = config?.headers?.['X-Request-Id']
  return typeof header === 'string' ? header : undefined
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getFieldErrors(error: unknown): Record<string, string> {
  return isApiError(error) ? error.fieldErrors : {}
}

export function createUploadProgressHandler(
  onProgress: (event: AxiosProgressEvent) => void,
): (event: AxiosProgressEvent) => void {
  return onProgress
}
