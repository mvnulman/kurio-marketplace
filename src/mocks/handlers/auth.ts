import { http } from 'msw'

import type { LoginInput, RegisterInput } from '@/lib/contracts/auth'

import { loginUser, logoutUser, readSession, registerUser } from '../domain/auth'
import { mockHandler } from '../http/handler'
import { noContent, parseJson } from '../http/respond'

export const authHandlers = [
  http.post(
    '/api/auth/login',
    mockHandler('POST /auth/login', async ({ request }) => {
      const input = await parseJson<LoginInput>(request)
      const session = await loginUser(request, input)
      return { session }
    }),
  ),

  http.post(
    '/api/auth/register',
    mockHandler('POST /auth/register', async ({ request }) => {
      const input = await parseJson<RegisterInput>(request)
      const session = await registerUser(request, input)
      return { session }
    }),
  ),

  http.get(
    '/api/auth/session',
    mockHandler('GET /auth/session', ({ request }) => readSession(request)),
  ),

  http.post(
    '/api/auth/logout',
    mockHandler('POST /auth/logout', ({ request }) => {
      logoutUser(request)
      return noContent()
    }),
  ),
]
