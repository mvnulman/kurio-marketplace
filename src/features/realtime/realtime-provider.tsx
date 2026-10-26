import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Socket } from 'socket.io-client'

import { accountKeys } from '@/features/account/queries'
import { cartKeys } from '@/features/cart/queries'
import { catalogKeys } from '@/features/catalog/queries'
import { favoriteKeys } from '@/features/favorites/mutations'
import type { Cart } from '@/lib/contracts/cart'
import type { CatalogResponse, NftDetailResponse } from '@/lib/contracts/catalog'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/lib/contracts/realtime'
import type { Order } from '@/lib/contracts/orders'
import {
  disconnectSocket,
  getSocket,
  updateSocketToken,
} from '@/lib/realtime/socket'
import { sessionTokenStorage } from '@/lib/storage'

import { useAuth } from '@/features/auth/auth-provider'

interface RealtimeContextValue {
  connected: boolean
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

/** Última versão aplicada por recurso; descarta duplicatas e eventos antigos. */
const lastVersionByResource = new Map<string, number>()

function isStale(event: RealtimeEvent): boolean {
  const key = `${event.resource.kind}:${event.resource.id}`
  const last = lastVersionByResource.get(key) ?? 0
  if (event.version <= last) return true
  lastVersionByResource.set(key, event.version)
  return false
}

interface RealtimeBindings {
  connect: () => void
  disconnect: () => void
  nftUpdated: (event: NftUpdatedEvent) => void
  orderUpdated: (event: OrderUpdatedEvent) => void
  off: () => void
}

function bindNftUpdated(queryClient: ReturnType<typeof useQueryClient>, event: NftUpdatedEvent): void {
  if (isStale(event)) return
  const { payload } = event

  queryClient.setQueriesData<CatalogResponse>({ queryKey: catalogKeys.lists() }, (data) =>
    data
      ? {
          ...data,
          items: data.items.map((nft) =>
            nft.id === payload.nftId
              ? {
                  ...nft,
                  priceEth: payload.priceEth,
                  editions: {
                    ...nft.editions,
                    available: payload.available,
                    isOpen: payload.isOpen,
                  },
                  version: payload.version,
                }
              : nft,
          ),
        }
      : data,
  )

  queryClient.setQueriesData<NftDetailResponse>({ queryKey: catalogKeys.details() }, (data) => {
    if (!data || data.nft.id !== payload.nftId) return data
    return {
      ...data,
      nft: {
        ...data.nft,
        priceEth: payload.priceEth,
        editions: {
          ...data.nft.editions,
          available: payload.available,
          isOpen: payload.isOpen,
        },
        version: payload.version,
      },
    }
  })

  const cart = queryClient.getQueryData<Cart>(cartKeys.detail())
  const inCart = (cart?.items ?? []).some((item) => item.nftId === payload.nftId)

  if (inCart) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })

    // Reserva/própria compra não devem alarmar o usuário.
    if (payload.reason === 'price-changed' || payload.reason === 'sold-out') {
      toast.warning('Uma obra do seu carrinho mudou.', {
        description:
          payload.reason === 'sold-out'
            ? 'A edição esgotou. Revise as quantidades antes de finalizar.'
            : `Novo preço: ${payload.priceEth} ETH. O resumo foi atualizado.`,
      })
    }
  }
}

function bindOrderUpdated(queryClient: ReturnType<typeof useQueryClient>, event: OrderUpdatedEvent): void {
  if (isStale(event)) return
  const { payload } = event

  queryClient.setQueryData<Order>(accountKeys.order(payload.orderId), (order) =>
    order
      ? {
          ...order,
          status: payload.status,
          txHash: payload.txHash,
          failureReason: payload.failureReason,
          confirmedAt: payload.confirmedAt,
          version: event.version,
          updatedAt: event.emittedAt,
        }
      : order,
  )

  void queryClient.invalidateQueries({ queryKey: accountKeys.orders() })
  void queryClient.invalidateQueries({ queryKey: accountKeys.order(payload.orderId) })

  if (payload.status === 'confirmed') {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    toast.success('Pagamento confirmado!', {
      description: 'Seu recibo já está disponível.',
      action: {
        label: 'Ver recibo',
        onClick: () => {
          window.location.assign(`/orders/${payload.orderId}`)
        },
      },
    })
  } else if (payload.status === 'failed') {
    toast.error('Pagamento não concluído.', {
      description: 'Seus itens seguem no carrinho.',
    })
  }
}

function createBindings(
  socket: Socket,
  queryClient: ReturnType<typeof useQueryClient>,
): RealtimeBindings {
  const onConnect = () => {
    // Reconciliação pós-conexão/reconexão: a REST é a fonte da verdade.
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    void queryClient.invalidateQueries({ queryKey: accountKeys.all })
    void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
  }
  const onNftUpdated = (event: NftUpdatedEvent) => bindNftUpdated(queryClient, event)
  const onOrderUpdated = (event: OrderUpdatedEvent) => bindOrderUpdated(queryClient, event)

  socket.on('connect', onConnect)
  socket.on('nft.updated', onNftUpdated)
  socket.on('order.updated', onOrderUpdated)

  return {
    connect: onConnect,
    disconnect: () => socket.disconnect(),
    nftUpdated: onNftUpdated,
    orderUpdated: onOrderUpdated,
    off: () => {
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.off('order.updated', onOrderUpdated)
    },
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)

  // Novo token (login/logout) precisa chegar ao servidor no handshake.
  useEffect(() => {
    void updateSocketToken(sessionTokenStorage.get())
  }, [isAuthenticated])

  useEffect(() => {
    let bindings: RealtimeBindings | null = null

    void (async () => {
      const socket = await getSocket()
      if (!socket) return
      bindings = createBindings(socket, queryClient)
      bindings.connect()
      setConnected(socket.connected)
    })()

    return () => {
      bindings?.off()
      bindings = null
    }
  }, [queryClient])

  // WebSocket aberto impede o bfcache: encerra no pagehide e restaura no pageshow.
  useEffect(() => {
    const onPageHide = () => disconnectSocket()
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void updateSocketToken(sessionTokenStorage.get()).then(() => {
          void queryClient.invalidateQueries()
        })
      }
    }
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [queryClient])

  const value = useMemo(() => ({ connected }), [connected])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime deve ser usado dentro de <RealtimeProvider>')
  return context
}

export { disconnectSocket }

