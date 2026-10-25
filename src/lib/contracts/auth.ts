export interface AuthUser {
  id: string
  displayName: string
  username: string
  email: string
  avatarUrl: string
  ensName: string
}

export interface Session {
  token: string
  user: AuthUser
  expiresAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface SessionResponse {
  session: Session
}
