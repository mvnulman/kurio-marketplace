import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { EmptyState, ErrorState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrdersQuery } from '@/features/account/queries'
import { requireSession } from '@/features/auth/guards'
import { formatDate } from '@/lib/format'
import { isApiError } from '@/lib/http'

export const Route = createFileRoute('/orders/')({
  beforeLoad: ({ location }) => requireSession(location),
  head: () => ({ meta: [{ title: 'Meus pedidos — KURIO' }] }),
  component: OrdersPage,
})

const STATUS_BADGE = {
  pending: { label: 'Pendente', variant: 'default' },
  confirmed: { label: 'Confirmado', variant: 'success' },
  failed: { label: 'Recusado', variant: 'destructive' },
} as const

function OrdersPage() {
  const query = useOrdersQuery()

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Pedidos' }]}
      />

      <h1 className="mt-5 text-2xl font-bold tracking-tight">Meus pedidos</h1>

      <div className="mt-6">
        {query.isPending ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            description={
              isApiError(query.error) ? query.error.message : 'Não foi possível carregar os pedidos.'
            }
            onRetry={() => {
              void query.refetch()
            }}
          />
        ) : query.data && query.data.length > 0 ? (
          <ul className="border-border/60 divide-y rounded-xl border">
            {query.data.map((order) => {
              const status = STATUS_BADGE[order.status]
              const summary =
                order.items.length === 1
                  ? `${order.items[0]?.name} · ${order.items[0]?.quantity} un.`
                  : `${order.items.length} obras · ${order.items.reduce((total, item) => total + item.quantity, 0)} un.`

              return (
                <li key={order.id}>
                  <Link
                    to="/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="hover:bg-card/60 focus-visible:ring-ring flex flex-wrap items-center gap-3 p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-muted-foreground block font-mono text-[10px]">
                        {order.id}
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold">{summary}</span>
                      <span className="text-muted-foreground mt-0.5 block text-[10px]">
                        {formatDate(order.createdAt)} · {order.walletLabel}
                      </span>
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-accent text-xs font-bold tabular-nums">
                      {order.totalEth} ETH
                    </span>
                    <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="Nenhum pedido ainda"
            description="Suas compras confirmadas e recusadas aparecem aqui com o recibo completo."
            actionLabel="Explorar catálogo"
            onAction={() => {
              void window.history.back()
            }}
          />
        )}
      </div>
    </div>
  )
}
