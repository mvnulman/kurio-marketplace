import type { LoginInput, RegisterInput, Session, SessionResponse } from '@/lib/contracts/auth'

import type { SeedUser } from '../fixtures/users'
import { createSession, deleteSession, findUserByEmail, findUserByUsername, getDb, lookupSession, nowIso, requireUser, saveDb, toAuthUser } from '../db'
import { MockError } from '../http/respond'
import { createSalt, hashPassword, verifyPassword } from '../password'
import { mergeGuestCart } from './cart'

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,24}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function loginUser(request: Request, input: LoginInput): Promise<Session> {
  const email = input.email?.trim().toLowerCase() ?? ''
  const password = input.password ?? ''

  const fields: Record<string, string> = {}
  if (!EMAIL_PATTERN.test(email)) fields.email = 'Informe um e-mail válido.'
  if (!password) fields.password = 'Informe sua senha.'

  if (Object.keys(fields).length > 0) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Revise os dados de acesso.', {
      fieldErrors: fields,
    })
  }

  const user = findUserByEmail(email)
  const valid = user ? await verifyPassword(password, user.salt, user.passwordHash) : false

  if (!user || !valid) {
    throw new MockError(401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.', {
      fieldErrors: { password: 'E-mail ou senha incorretos.' },
    })
  }

  const session = issueSession(user.id)
  mergeGuestCart(request, user.id)
  return session
}

export async function registerUser(request: Request, input: RegisterInput): Promise<Session> {
  const username = input.username?.trim().toLowerCase() ?? ''
  const email = input.email?.trim().toLowerCase() ?? ''
  const password = input.password ?? ''
  const fields: Record<string, string> = {}

  if (!USERNAME_PATTERN.test(username)) {
    fields.username = 'Use de 3 a 24 caracteres (letras, números, ponto, hífen ou _).'
  }
  if (!EMAIL_PATTERN.test(email)) {
    fields.email = 'Informe um e-mail válido.'
  }
  if (password.length < 8) {
    fields.password = 'A senha precisa ter ao menos 8 caracteres.'
  }

  if (Object.keys(fields).length > 0) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Revise os dados do cadastro.', {
      fieldErrors: fields,
    })
  }

  if (findUserByUsername(username)) {
    throw new MockError(409, 'CONFLICT', 'Este nome de usuário já está em uso.', {
      fieldErrors: { username: 'Este nome de usuário já está em uso.' },
    })
  }
  if (findUserByEmail(email)) {
    throw new MockError(409, 'CONFLICT', 'Este e-mail já está cadastrado.', {
      fieldErrors: { email: 'Este e-mail já está cadastrado.' },
    })
  }

  const salt = createSalt()
  const passwordHash = await hashPassword(password, salt)
  const createdAt = nowIso()

  const user: SeedUser = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    displayName: username,
    username,
    email,
    avatarUrl: '',
    ensName: `${username}.eth`,
    passwordHash,
    salt,
    createdAt,
    updatedAt: createdAt,
  }

  const db = getDb()
  db.users.push(user)
  db.profiles[user.id] = {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: 'Carteira principal',
    avatarUrl: '',
    createdAt,
    updatedAt: createdAt,
  }
  db.wallets[user.id] = []
  db.favorites[user.id] = []
  saveDb()

  const session = issueSession(user.id)
  mergeGuestCart(request, user.id)
  return session
}

function issueSession(userId: string): Session {
  const session = createSession(userId)
  return session
}

export function readSession(request: Request): SessionResponse {
  const user = requireUser(request)
  const lookup = lookupSession(request)
  const expiresAt = lookup.token ? getDb().sessions[lookup.token]?.expiresAt : undefined

  return {
    session: {
      token: lookup.token ?? '',
      user: toAuthUser(user),
      expiresAt: expiresAt ?? nowIso(),
    },
  }
}

export function logoutUser(request: Request): void {
  const lookup = lookupSession(request)
  deleteSession(lookup.token)
}
