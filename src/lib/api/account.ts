import type {
  ChangePasswordInput,
  Profile,
  ProfileResponse,
  UpdateProfileInput,
  Wallet,
  WalletInput,
  WalletsResponse,
} from '@/lib/contracts/account'
import { endpoints, http } from '@/lib/http'

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<ProfileResponse>(endpoints.profile.root, { signal })
  return data.profile
}

export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const { data } = await http.put<ProfileResponse>(endpoints.profile.root, input)
  return data.profile
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await http.put(endpoints.profile.password, input)
}

export async function uploadAvatar(avatarUrl: string): Promise<Profile> {
  const { data } = await http.put<ProfileResponse>(endpoints.profile.avatar, { avatarUrl })
  return data.profile
}

export async function fetchWallets(signal?: AbortSignal): Promise<WalletsResponse> {
  const { data } = await http.get<WalletsResponse>(endpoints.wallets.root, { signal })
  return data
}

export async function createWallet(input: WalletInput): Promise<Wallet> {
  const { data } = await http.post<{ wallet: Wallet }>(endpoints.wallets.root, input)
  return data.wallet
}

export async function updateWallet(walletId: string, input: WalletInput): Promise<Wallet> {
  const { data } = await http.put<{ wallet: Wallet }>(endpoints.wallets.detail(walletId), input)
  return data.wallet
}

export async function removeWallet(walletId: string): Promise<void> {
  await http.delete(endpoints.wallets.detail(walletId))
}
