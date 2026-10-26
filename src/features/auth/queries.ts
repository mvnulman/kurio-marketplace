import { useQuery } from '@tanstack/react-query'

import { fetchSession } from '@/lib/api/auth'
import type { Session } from '@/lib/contracts/auth'
import { sessionTokenStorage } from '@/lib/storage'

export const sessionKeys = {
  current: ['session'] as const,
}

export function hasStoredSession(): boolean {
  return Boolean(sessionTokenStorage.get())
}

export function useSessionQuery(enabled = hasStoredSession()) {
  return useQuery<Session>({
    queryKey: sessionKeys.current,
    queryFn: ({ signal }) => fetchSession(signal),
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
