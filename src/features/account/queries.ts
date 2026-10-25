import { useQuery } from '@tanstack/react-query'

import { fetchProfile, fetchWallets } from '@/lib/api/account'
import { fetchOrder, fetchOrders } from '@/lib/api/orders'
import type { Profile, Wallet } from '@/lib/contracts/account'
import type { Order } from '@/lib/contracts/orders'
import { hasStoredSession } from '@/features/auth/queries'

export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  wallets: () => [...accountKeys.all, 'wallets'] as const,
  orders: () => [...accountKeys.all, 'orders'] as const,
  order: (orderId: string) => [...accountKeys.orders(), orderId] as const,
}

export function useProfileQuery() {
  return useQuery<Profile>({
    queryKey: accountKeys.profile(),
    queryFn: ({ signal }) => fetchProfile(signal),
    enabled: hasStoredSession(),
    retry: false,
  })
}

export function useWalletsQuery() {
  return useQuery<{ primary: Wallet | null; secondary: Wallet | null }>({
    queryKey: accountKeys.wallets(),
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: hasStoredSession(),
    retry: false,
  })
}

export function useOrdersQuery() {
  return useQuery<Order[]>({
    queryKey: accountKeys.orders(),
    queryFn: ({ signal }) => fetchOrders(signal),
    enabled: hasStoredSession(),
  })
}

export function useOrderQuery(orderId: string) {
  return useQuery<Order>({
    queryKey: accountKeys.order(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: hasStoredSession(),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1500 : false),
  })
}
