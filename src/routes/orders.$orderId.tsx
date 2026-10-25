import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { ErrorState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderQuery } from '@/features/account/queries'
import { requireSession } from '@/features/auth/guards'
import { NETWORKS } from '@/lib/contracts/common'
import type { Order } from '@/lib/contracts/orders'
import { formatDate } from '@/lib/format'
import { isApiError } from '@/lib/http'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: ({ location }) => requireSession(location),
  head: () => ({ meta: [{ title: 'Confirmação do pedido — KURIO' }] }),
  component: OrderReceiptPage,
})

function ReceiptCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/60 bg-card/50 mx-auto max-w-2xl rounded-xl border p-6 sm:p-8">
      {children}
    </div>
  )
}

function OrderItems({ order }: { order: Order }) {
  return (
    <div className="mt-6 text-left">
      <h2 className="text-xs font-bold">Detalhes da transação</h2>
      <ul className="mt-3 divide-y divide-border/60">
        {order.items.map((item) => (
          <li key={item.nftId} className="flex items-center gap-3 py-3">
            <img
              src={item.imageUrl}
              alt=""
              width={720}
              height={720}
              loading="lazy"
              className="size-12 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{item.name}</p>
              <p className="text-muted-foreground text-[10px]">
                ID do token: #{item.tokenId} · {item.quantity} un.
              </p>
            </div>
            <p className="text-accent text-xs font-bold tabular-nums">
              {item.lineTotalEth} ETH
            </p>
          </li>
        ))}
      </ul>

      <dl className="border-border/60 mt-2 space-y-2 border-t pt-4 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Taxa de rede</dt>
          <dd className="tabular-nums">{order.networkFeeEth} ETH</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm font-bold">Total</dt>
          <dd className="text-accent text-sm font-bold tabular-nums">{order.totalEth} ETH</dd>
        </div>
      </dl>
    </div>
  )
}

function OrderReceiptPage() {
  const { orderId } = Route.useParams()
  const query = useOrderQuery(orderId)
  const order = query.data

  useEffect(() => {
    if (order) document.title = `Pedido ${order.id} — KURIO`
  }, [order])

  if (query.isPending) {
    return (
      <div className="container-page py-16">
        <ReceiptCard>
          <div className="space-y-4" aria-busy="true" aria-label="Carregando pedido">
            <Skeleton className="mx-auto size-14 rounded-full" />
            <Skeleton className="mx-auto h-5 w-64" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </ReceiptCard>
      </div>
    )
  }

  if (query.isError || !order) {
    return (
      <div className="container-page py-16">
        <ErrorState
          description={
            isApiError(query.error) && query.error.status === 404
              ? 'Pedido não encontrado para esta conta.'
              : 'Não foi possível carregar seu pedido.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      </div>
    )
  }

  const networkLabel = NETWORKS.find((network) => network.id === order.network)?.label ?? order.network

  if (order.status === 'pending') {
    return (
      <div className="container-page py-16">
        <ReceiptCard>
          <div className="text-center" aria-busy="true">
            <Loader2
              className="text-primary mx-auto size-12 animate-spin"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-lg font-bold">Processando pagamento…</h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
              Assim que a simulação da rede confirmar, o recibo aparece aqui. Você pode navegar
              para fora e voltar — o pedido não será duplicado.
            </p>
            <Badge variant="muted" className="mt-4">
              Pedido {order.id}
            </Badge>
          </div>
          <OrderItems order={order} />
        </ReceiptCard>
      </div>
    )
  }

  if (order.status === 'failed') {
    return (
      <div className="container-page py-16">
        <ReceiptCard>
          <div className="text-center">
            <span className="bg-destructive/15 mx-auto flex size-14 items-center justify-center rounded-full">
              <XCircle className="text-destructive size-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-lg font-bold">Pagamento não concluído</h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
              {order.failureReason ?? 'A simulação recusou o pagamento.'} Seus itens seguem no
              carrinho e o estoque foi devolvido.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/cart">Voltar ao carrinho</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/orders">Ver meus pedidos</Link>
              </Button>
            </div>
          </div>
          <OrderItems order={order} />
        </ReceiptCard>
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Pedido confirmado' }]}
      />

      <div className="mt-6">
        <ReceiptCard>
          <div className="text-center">
            <span className="bg-success/15 mx-auto flex size-14 items-center justify-center rounded-full">
              <CheckCircle2 className="text-success size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-lg font-bold">
              Seus NFTs agora estão na sua carteira
            </h1>
          </div>

          <dl className="border-border/60 mt-6 grid grid-cols-2 gap-4 border-y py-4 text-left text-[11px] sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">ID da transação</dt>
              <dd className="mt-1 flex items-center gap-1 font-mono text-[10px]">
                {order.txHash.slice(0, 10)}…
                <button
                  type="button"
                  aria-label="Copiar ID da transação"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(order.txHash)
                      .then(() => toast.success('ID da transação copiado.'))
                      .catch(() => toast.error('Não foi possível copiar.'))
                  }}
                  className="hover:text-accent rounded-sm p-0.5"
                >
                  <Copy className="size-3" aria-hidden="true" />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data</dt>
              <dd className="mt-1">{formatDate(order.confirmedAt ?? order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="text-accent mt-1 font-bold">{order.totalEth} ETH</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Carteira</dt>
              <dd className="mt-1">{order.walletLabel}</dd>
            </div>
          </dl>

          <OrderItems order={order} />

          <p className="text-muted-foreground mt-5 text-center text-[10px] leading-relaxed">
            Transação confirmada na rede {networkLabel}. A propriedade foi transferida para sua
            carteira conectada e registrada no histórico (simulação).
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() =>
                toast.info('Exploração de blockchain não faz parte desta entrega.', {
                  description: `Hash simulado: ${order.txHash.slice(0, 18)}…`,
                })
              }
            >
              <ExternalLink aria-hidden="true" />
              Ver no Etherscan
            </Button>
            <Button asChild variant="outline">
              <Link to="/" hash="catalogo">
                Continuar explorando
              </Link>
            </Button>
          </div>
        </ReceiptCard>

        <div className="mx-auto mt-5 max-w-2xl text-center">
          <Link
            to="/orders"
            className="text-muted-foreground hover:text-accent text-[10px] tracking-[0.08em] uppercase"
          >
            Ver todos os pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}

