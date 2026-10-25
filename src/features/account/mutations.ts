import { useMutation, useQueryClient } from '@tanstack/react-query'

import { changePassword, createWallet, removeWallet, updateProfile, updateWallet, uploadAvatar } from '@/lib/api/account'
import type { Profile, Wallet, WalletInput } from '@/lib/contracts/account'
import type { ChangePasswordInput, UpdateProfileInput } from '@/lib/contracts/account'

import { accountKeys } from './queries'
import { sessionKeys } from '@/features/auth/queries'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<Profile, unknown, UpdateProfileInput>({
    mutationFn: (input) => updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(accountKeys.profile(), profile)
      void queryClient.invalidateQueries({ queryKey: sessionKeys.current })
    },
  })
}

export function useChangePassword() {
  return useMutation<void, unknown, ChangePasswordInput>({
    mutationFn: (input) => changePassword(input),
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation<Profile, unknown, string>({
    mutationFn: (avatarUrl) => uploadAvatar(avatarUrl),
    onSuccess: (profile) => {
      queryClient.setQueryData(accountKeys.profile(), profile)
      void queryClient.invalidateQueries({ queryKey: sessionKeys.current })
    },
  })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()

  return useMutation<Wallet, unknown, WalletInput & { walletId?: string }>({
    mutationFn: ({ walletId, ...input }) =>
      walletId ? updateWallet(walletId, input) : createWallet(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.wallets() })
    },
  })
}

export function useDeleteWallet() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (walletId) => removeWallet(walletId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.wallets() })
    },
  })
}
