import type {
  LoginInput,
  RegisterInput,
  Session,
  SessionResponse,
} from '@/lib/contracts/auth'
import { endpoints, http } from '@/lib/http'

export async function login(input: LoginInput): Promise<Session> {
  const { data } = await http.post<SessionResponse>(endpoints.auth.login, input)
  return data.session
}

export async function register(input: RegisterInput): Promise<Session> {
  const { data } = await http.post<SessionResponse>(endpoints.auth.register, input)
  return data.session
}

export async function fetchSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await http.get<SessionResponse>(endpoints.auth.session, { signal })
  return data.session
}

export async function logout(): Promise<void> {
  await http.post(endpoints.auth.logout)
}
