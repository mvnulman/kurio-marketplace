import type { NetworkId } from './common'

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase'

export const WALLET_TYPES: ReadonlyArray<{ id: WalletType; label: string }> = [
  { id: 'metamask', label: 'MetaMask' },
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
]

export interface Profile {
  id: string
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface Wallet {
  id: string
  label: string
  address: string
  ensName?: string
  network: NetworkId
  type: WalletType
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface WalletInput {
  label: string
  address: string
  ensName?: string
  network: NetworkId
  type: WalletType
  isPrimary: boolean
}

export interface WalletsResponse {
  primary: Wallet | null
  secondary: Wallet | null
}

export interface ProfileResponse {
  profile: Profile
}

export interface AvatarUploadInput {
  /** Data URL ou URL pública do avatar. */
  avatarUrl: string
}
