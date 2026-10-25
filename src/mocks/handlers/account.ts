import { http } from 'msw'

import type {
  ChangePasswordInput,
  UpdateProfileInput,
  WalletInput,
} from '@/lib/contracts/account'

import { getProfileRecord, requireUser } from '../db'
import {
  changePassword,
  deleteWallet,
  listWallets,
  saveWallet,
  updateAvatar,
  updateProfile,
} from '../domain/account'
import { mockHandler, pathParam } from '../http/handler'
import { noContent, parseJson } from '../http/respond'

export const accountHandlers = [
  http.get(
    '/api/profile',
    mockHandler('GET /profile', ({ request }) => {
      const user = requireUser(request)
      return { profile: getProfileRecord(user.id) }
    }),
  ),

  http.put(
    '/api/profile',
    mockHandler('PUT /profile', async ({ request }) => {
      const user = requireUser(request)
      const input = await parseJson<UpdateProfileInput>(request)
      return { profile: await updateProfile(user, input) }
    }),
  ),

  http.put(
    '/api/profile/password',
    mockHandler('PUT /profile/password', async ({ request }) => {
      const user = requireUser(request)
      const input = await parseJson<ChangePasswordInput>(request)
      await changePassword(user, input)
      return noContent()
    }),
  ),

  http.put(
    '/api/profile/avatar',
    mockHandler('PUT /profile/avatar', async ({ request }) => {
      const user = requireUser(request)
      const input = await parseJson<{ avatarUrl: string }>(request)
      return { profile: updateAvatar(user, input.avatarUrl) }
    }),
  ),

  http.get(
    '/api/wallets',
    mockHandler('GET /wallets', ({ request }) => {
      const user = requireUser(request)
      return listWallets(user.id)
    }),
  ),

  http.post(
    '/api/wallets',
    mockHandler('POST /wallets', async ({ request }) => {
      const user = requireUser(request)
      const input = await parseJson<WalletInput>(request)
      return { wallet: saveWallet(user.id, input) }
    }),
  ),

  http.put(
    '/api/wallets/:walletId',
    mockHandler('PUT /wallets/:walletId', async ({ request, params }) => {
      const user = requireUser(request)
      const input = await parseJson<WalletInput>(request)
      return {
        wallet: saveWallet(user.id, input, pathParam({ request, params }, 'walletId')),
      }
    }),
  ),

  http.delete(
    '/api/wallets/:walletId',
    mockHandler('DELETE /wallets/:walletId', ({ request, params }) => {
      const user = requireUser(request)
      deleteWallet(user.id, pathParam({ request, params }, 'walletId'))
      return noContent()
    }),
  ),
]
