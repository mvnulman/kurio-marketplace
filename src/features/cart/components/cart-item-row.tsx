import { Link } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'

import { QuantityStepper } from '@/components/common/quantity-stepper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartItem } from '@/lib/contracts/cart'
import { formatEth } from '@/lib/money'

export function CartItemRow({
  item,
  update,
  remove,
}: {
  item: CartItem
  update: { mutate: (input: { nftId: string; quantity: number }) => void; isPending: boolean }
  remove: { mutate: (input: { nftId: string }) => void; isPending: boolean }
}) {
  const unavailable = !item.isAvailable
  const stepperMax = Math.max(item.available, 1)

  return (
    <article className="border-border/60 border-b py-4">
      <div className="flex gap-4">
        <Link
          to="/nft/$nftId"
          params={{ nftId: item.nftId }}
          className="focus-visible:ring-ring shrink-0 rounded-md focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Ver ${item.name}`}
        >
          <img
            src={item.imageUrl}
            alt={`${item.name} — obra no carrinho`}
            width={900}
            height={900}
            loading="lazy"
            decoding="async"
            className="size-16 rounded-md object-cover sm:size-20"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold">
                <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="hover:text-accent">
                  {item.name}
                </Link>
              </h3>
              <p className="text-muted-foreground mt-1 text-[10px]">ID do token: #{item.tokenId}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${item.name} do carrinho`}
              disabled={remove.isPending}
              onClick={() => remove.mutate({ nftId: item.nftId })}
              className="text-muted-foreground hover:text-destructive size-8"
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <QuantityStepper
              value={item.quantity}
              max={stepperMax}
              compact
              disabled={unavailable}
              onChange={(quantity) => update.mutate({ nftId: item.nftId, quantity })}
            />

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-muted-foreground text-[9px] tracking-[0.08em] uppercase">
                  Unitário
                </p>
                <p className="text-muted-foreground text-[11px] tabular-nums">
                  {formatEth(item.unitPriceEth)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-[9px] tracking-[0.08em] uppercase">
                  Total
                </p>
                <p className="text-accent text-xs font-bold tabular-nums">
                  {formatEth(item.lineTotalEth)}
                </p>
              </div>
            </div>
          </div>

          {unavailable ? (
            <p role="alert" className="text-destructive mt-2 text-[10px]">
              {item.available > 0
                ? `Apenas ${item.available} unidades disponíveis. Ajuste a quantidade para finalizar.`
                : 'Esta edição esgotou. Remova o item para finalizar a compra.'}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function CartItemRowSkeleton() {
  return (
    <div className="border-border/60 flex gap-4 border-b py-4" aria-hidden="true">
      <Skeleton className="size-16 rounded-md sm:size-20" />
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
