import type {
  ChangePasswordInput,
  UpdateProfileInput,
  Wallet,
  WalletInput,
  WalletsResponse,
} from '@/lib/contracts/account'
import type { Profile } from '@/lib/contracts/account'
import { NETWORKS } from '@/lib/contracts/common'
import { WALLET_TYPES } from '@/lib/contracts/account'

import type { SeedUser } from '../fixtures/users'
import { MockError, getDb, getProfileRecord, getWalletRecords, nowIso, saveDb } from '../db'
import { createSalt, hashPassword, verifyPassword } from '../password'

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,24}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ENS_PATTERN = /^[a-zA-Z0-9-]{3,32}(\.eth)?$/i
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
const MAX_AVATAR_BYTES = 1_500_000

export async function updateProfile(
  user: SeedUser,
  input: UpdateProfileInput,
): Promise<Profile> {
  const db = getDb()
  const fields: Record<string, string> = {}

  const displayName = input.displayName?.trim() ?? ''
  const username = input.username?.trim().toLowerCase() ?? ''
  const email = input.email?.trim().toLowerCase() ?? ''
  const ensName = input.ensName?.trim() ?? ''
  const walletNickname = input.walletNickname?.trim() ?? ''

  if (displayName.length < 2 || displayName.length > 80) {
    fields.displayName = 'Informe um nome entre 2 e 80 caracteres.'
  }
  if (!USERNAME_PATTERN.test(username)) {
    fields.username = 'Use de 3 a 24 caracteres (letras, números, ponto, hífen ou _).'
  }
  if (!EMAIL_PATTERN.test(email)) {
    fields.email = 'Informe um e-mail válido.'
  }
  if (input.ensName !== undefined && input.ensName !== '' && !ENS_PATTERN.test(ensName)) {
    fields.ensName = 'Informe um nome ENS válido (sem .eth).'
  }
  if (walletNickname.length < 2 || walletNickname.length > 40) {
    fields.walletNickname = 'Informe um apelido entre 2 e 40 caracteres.'
  }

  if (
    username !== user.username &&
    db.users.some((candidate) => candidate.id !== user.id && candidate.username === username)
  ) {
    fields.username = 'Este nome de usuário já está em uso.'
  }
  if (
    email !== user.email &&
    db.users.some((candidate) => candidate.id !== user.id && candidate.email === email)
  ) {
    fields.email = 'Este e-mail já está cadastrado.'
  }

  if (Object.keys(fields).length > 0) {
    const hasConflict = Boolean(fields.username?.includes('uso') || fields.email?.includes('cadastrado'))
    throw new MockError(
      hasConflict ? 409 : 400,
      hasConflict ? 'CONFLICT' : 'VALIDATION_ERROR',
      'Revise os dados do perfil.',
      { fieldErrors: fields },
    )
  }

  const updatedAt = nowIso()
  user.displayName = displayName
  user.username = username
  user.email = email
  user.ensName = ensName
  user.updatedAt = updatedAt

  const profile = getProfileRecord(user.id)
  profile.displayName = displayName
  profile.username = username
  profile.email = email
  profile.ensName = ensName
  profile.walletNickname = walletNickname
  if (input.avatarUrl !== undefined) profile.avatarUrl = input.avatarUrl
  profile.updatedAt = updatedAt
  user.avatarUrl = profile.avatarUrl

  saveDb()
  return profile
}

export async function changePassword(
  user: SeedUser,
  input: ChangePasswordInput,
): Promise<void> {
  const fields: Record<string, string> = {}

  if (!input.currentPassword) fields.currentPassword = 'Informe sua senha atual.'
  if (!input.newPassword || input.newPassword.length < 8) {
    fields.newPassword = 'A nova senha precisa ter ao menos 8 caracteres.'
  }
  if (input.newPassword === input.currentPassword) {
    fields.newPassword = 'A nova senha deve ser diferente da atual.'
  }
  if (Object.keys(fields).length > 0) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Revise os dados de senha.', {
      fieldErrors: fields,
    })
  }

  const valid = await verifyPassword(input.currentPassword, user.salt, user.passwordHash)
  if (!valid) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Senha atual incorreta.', {
      fieldErrors: { currentPassword: 'Senha atual incorreta.' },
    })
  }

  const salt = createSalt()
  user.salt = salt
  user.passwordHash = await hashPassword(input.newPassword, salt)
  user.updatedAt = nowIso()
  saveDb()
}

export function updateAvatar(user: SeedUser, avatarUrl: string): Profile {
  const trimmed = avatarUrl.trim()

  // string vazia remove o avatar atual
  if (trimmed !== '') {
    const isDataUrl = /^data:image\/(png|jpeg|webp);base64,/.test(trimmed)
    const isLocalAsset = trimmed.startsWith('/assets/')
    if (!isDataUrl && !isLocalAsset) {
      throw new MockError(400, 'VALIDATION_ERROR', 'Formato de imagem não suportado.', {
        fieldErrors: { avatarUrl: 'Envie uma imagem PNG, JPEG ou WebP.' },
      })
    }
    if (trimmed.length > MAX_AVATAR_BYTES) {
      throw new MockError(413, 'VALIDATION_ERROR', 'A imagem deve ter no máximo 1,5 MB.', {
        fieldErrors: { avatarUrl: 'A imagem deve ter no máximo 1,5 MB.' },
      })
    }
  }

  const profile = getProfileRecord(user.id)
  profile.avatarUrl = trimmed
  profile.updatedAt = nowIso()
  user.avatarUrl = trimmed
  saveDb()
  return profile
}

function validateWalletInput(input: WalletInput, fields: Record<string, string>): void {
  if (!input.label?.trim() || input.label.trim().length > 40) {
    fields.label = 'Informe um apelido de até 40 caracteres.'
  }
  if (!ADDRESS_PATTERN.test(input.address?.trim() ?? '')) {
    fields.address = 'Endereço deve ter 0x + 40 caracteres hexadecimais.'
  }
  if (input.ensName && !ENS_PATTERN.test(input.ensName.trim())) {
    fields.ensName = 'Informe um nome ENS válido.'
  }
  if (!NETWORKS.some((network) => network.id === input.network)) {
    fields.network = 'Selecione uma rede.'
  }
  if (!WALLET_TYPES.some((type) => type.id === input.type)) {
    fields.type = 'Selecione um tipo de carteira.'
  }
}

export function listWallets(userId: string): WalletsResponse {
  const wallets = getWalletRecords(userId)
  return {
    primary: wallets.find((wallet) => wallet.isPrimary) ?? null,
    secondary: wallets.find((wallet) => !wallet.isPrimary) ?? null,
  }
}

export function saveWallet(
  userId: string,
  input: WalletInput,
  walletId?: string,
): Wallet {
  const wallets = getDb().wallets[userId] ?? []
  const fields: Record<string, string> = {}
  validateWalletInput(input, fields)

  const address = input.address?.trim()
  if (
    wallets.some(
      (wallet) => wallet.id !== walletId && wallet.address.toLowerCase() === address.toLowerCase(),
    )
  ) {
    fields.address = 'Esta carteira já está cadastrada.'
  }

  if (!walletId && wallets.length >= 2) {
    throw new MockError(409, 'CONFLICT', 'Você já cadastrou as duas carteiras disponíveis.')
  }

  if (Object.keys(fields).length > 0) {
    throw new MockError(400, 'VALIDATION_ERROR', 'Revise os dados da carteira.', {
      fieldErrors: fields,
    })
  }

  const updatedAt = nowIso()
  const existing = walletId ? wallets.find((wallet) => wallet.id === walletId) : undefined
  if (walletId && !existing) {
    throw new MockError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  }

  if (input.isPrimary) {
    for (const wallet of wallets) {
      if (wallet.id !== walletId) wallet.isPrimary = false
    }
  }

  const wallet: Wallet = existing ?? {
    id: `wallet_${crypto.randomUUID().slice(0, 8)}`,
    label: input.label,
    address: input.address,
    ensName: input.ensName,
    network: input.network,
    type: input.type,
    isPrimary: input.isPrimary,
    createdAt: updatedAt,
    updatedAt,
  }

  wallet.label = input.label.trim()
  wallet.address = input.address.trim()
  wallet.ensName = input.ensName?.trim() || undefined
  wallet.network = input.network
  wallet.type = input.type
  wallet.isPrimary = input.isPrimary
  wallet.updatedAt = updatedAt

  if (!existing) {
    if (wallets.length === 0) wallet.isPrimary = true
    wallets.push(wallet)
  }

  getDb().wallets[userId] = wallets
  saveDb()
  return wallet
}

export function deleteWallet(userId: string, walletId: string): void {
  const wallets = getDb().wallets[userId] ?? []
  const wallet = wallets.find((candidate) => candidate.id === walletId)
  if (!wallet) throw new MockError(404, 'NOT_FOUND', 'Carteira não encontrada.')

  const remaining = wallets.filter((candidate) => candidate.id !== walletId)
  if (wallet.isPrimary && remaining.length > 0) {
    const promoted = remaining[0]
    if (promoted) promoted.isPrimary = true
  }
  getDb().wallets[userId] = remaining
  saveDb()
}

export { USERNAME_PATTERN, EMAIL_PATTERN, ENS_PATTERN, ADDRESS_PATTERN }
