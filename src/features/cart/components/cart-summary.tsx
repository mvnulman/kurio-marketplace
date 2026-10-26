import { Link } from '@tanstack/react-router'
import { ArrowRight, Loader2, Tag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/lib/contracts/cart'
import { useAuth } from '@/features/auth/auth-provider'
import { isApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'

interface CartSummaryProps {
  cart: Cart | undefined
  hasUnavailable: boolean
  onApplyCoupon: (code: string) => Promise<void>
  onRemoveCoupon: () => Promise<void>
}

export function CartSummary({
  cart,
  hasUnavailable,
  onApplyCoupon,
  onRemoveCoupon,
}: CartSummaryProps) {
  const { isAuthenticated } = useAuth()
  const [code, setCode] = useState('')

  if (!cart) {
    return (
      <div className="border-border/60 bg-card/40 space-y-4 rounded-xl border p-6" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  }

  const checkoutLabel = isAuthenticated ? 'Finalizar compra' : 'Entrar e finalizar'

  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="border-border/60 bg-card/40 rounded-xl border p-6 lg:sticky lg:top-24"
    >
      <h2 id="cart-summary-title" className="text-sm font-bold tracking-tight">
        Resumo do carrinho
      </h2>

      {cart.coupon ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
          <p className="flex items-center gap-2 text-[11px]">
            <Tag className="text-accent size-3.5" aria-hidden="true" />
            <span className="font-bold">{cart.coupon.code}</span>
            <span className="text-muted-foreground">· {cart.coupon.description}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              void onRemoveCoupon()
            }}
            aria-label="Remover cupom"
            className="text-muted-foreground hover:text-destructive rounded-sm p-1"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (!code.trim()) return
            void onApplyCoupon(code.trim())
          }}
        >
          <label htmlFor="cart-coupon" className="text-muted-foreground text-[10px] font-bold tracking-[0.1em] uppercase">
            Código promocional
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="cart-coupon"
              name="coupon"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o código…"
              className="h-10 text-xs"
              maxLength={24}
            />
            <Button type="submit" size="sm" className="shrink-0 px-4">
              Aplicar
            </Button>
          </div>
          <p className="text-muted-foreground/70 mt-2 text-[10px]">
            Experimente KURIO10 ou LAUNCH5. Cupons expirados e inválidos são tratados.
          </p>
        </form>
      )}

      <dl className="border-border/60 mt-6 space-y-3 border-t pt-5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatEth(cart.subtotalEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Desconto do cupom</dt>
          <dd className="tabular-nums">
            {cart.discountEth !== '0' ? `(-) ${formatEth(cart.discountEth)}` : formatEth('0')}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">
            Taxa de rede
            <span className="text-muted-foreground/70 ml-2 block text-[9px] normal-case">
              Taxa estimada
            </span>
          </dt>
          <dd className="tabular-nums">{formatEth(cart.networkFeeEth)}</dd>
        </div>
        <div className="border-border/60 flex items-center justify-between gap-4 border-t pt-3">
          <dt className="text-sm font-bold">Total</dt>
          <dd className="text-accent text-sm font-bold tabular-nums">
            {formatEth(cart.totalEth)}
          </dd>
        </div>
      </dl>

      {hasUnavailable ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive mt-5 rounded-md border px-3 py-2 text-[10px]"
        >
          Revise os itens indisponíveis ou esgotados antes de finalizar a compra.
        </p>
      ) : null}

      {isAuthenticated ? (
        <Button asChild size="lg" className="mt-5 w-full" disabled={hasUnavailable}>
          <Link to="/checkout">
            {checkoutLabel} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button asChild size="lg" className="mt-5 w-full" disabled={hasUnavailable}>
          <Link to="/login" search={{ redirect: '/checkout' }}>
            {checkoutLabel}
          </Link>
        </Button>
      )}

      <Link
        to="/"
        hash="catalogo"
        className="text-muted-foreground hover:text-accent mt-4 flex items-center justify-center gap-1 text-[10px] tracking-[0.08em] uppercase"
      >
        Continuar explorando
      </Link>

      <Badge variant="muted" className="mt-5 w-full justify-center">
        {(cart.items ?? []).length} {(cart.items ?? []).length === 1 ? 'item' : 'itens'} · salvo na sua sessão
      </Badge>
    </aside>
  )
}

export function couponErrorToast(error: unknown): void {
  toast.error(
    isApiError(error) ? error.message : 'Não foi possível aplicar o cupom.',
  )
}

export function CartSpinner() {
  return <Loader2 className="size-4 animate-spin" aria-hidden="true" />
}


