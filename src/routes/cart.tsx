import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { NftCard } from '@/components/common/nft-card'
import { EmptyState, ErrorState } from '@/components/common/states'
import { CartItemRow, CartItemRowSkeleton } from '@/features/cart/components/cart-item-row'
import { CartSummary, couponErrorToast } from '@/features/cart/components/cart-summary'
import { useApplyCoupon, useRemoveCartItem, useRemoveCoupon, useUpdateCartItem } from '@/features/cart/mutations'
import { cartItemCount, useCartQuery } from '@/features/cart/queries'
import { useCatalogQuery } from '@/features/catalog/queries'
import { isApiError } from '@/lib/http'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Carrinho de NFTs — KURIO' }] }),
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const cartQuery = useCartQuery()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const related = useCatalogQuery({ sort: 'recent', pageSize: 5 })

  const cart = cartQuery.data
  const count = cartItemCount(cart)
  const hasUnavailable = Boolean(
    cart?.items.some((item) => !item.isAvailable),
  )

  async function handleApplyCoupon(code: string) {
    try {
      await applyCoupon.mutateAsync({ code })
      toast.success('Cupom aplicado ao carrinho.')
    } catch (error) {
      couponErrorToast(error)
    }
  }

  async function handleRemoveCoupon() {
    try {
      await removeCoupon.mutateAsync()
      toast.success('Cupom removido.')
    } catch {
      toast.error('Não foi possível remover o cupom.')
    }
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Carrinho' }]}
      />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Carrinho de NFTs</h1>
        <p aria-live="polite" className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
          {cartQuery.isPending
            ? 'Carregando…'
            : cart
              ? `${count} ${count === 1 ? 'item' : 'itens'}`
              : ''}
        </p>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Itens do carrinho">
          {cartQuery.isPending ? (
            <div aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <CartItemRowSkeleton key={index} />
              ))}
            </div>
          ) : cartQuery.isError ? (
            <ErrorState
              description={
                isApiError(cartQuery.error)
                  ? cartQuery.error.message
                  : 'Não foi possível carregar seu carrinho.'
              }
              onRetry={() => {
                void cartQuery.refetch()
              }}
            />
          ) : cart && cart.items.length > 0 ? (
            <div>
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.nftId}
                  item={item}
                  update={updateItem}
                  remove={removeItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Seu carrinho está vazio"
              description="Explore o catálogo e adicione obras para finalizar sua compra."
              actionLabel="Explorar catálogo"
              onAction={() => {
                void navigate({ to: '/', hash: 'catalogo' })
              }}
            />
          )}
        </section>

        <CartSummary
          cart={cart}
          hasUnavailable={hasUnavailable}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </div>

      {related.data && related.data.items.length > 0 ? (
        <section aria-labelledby="also-like-title" className="mt-20">
          <h2 id="also-like-title" className="text-accent text-[10px] tracking-[0.2em] uppercase">
            Colecionadores também viram
          </h2>
          <div className="scrollbar-slim mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
            {related.data.items.map((nft) => (
              <div key={nft.id} className="w-[190px] shrink-0 snap-start sm:w-[210px]">
                <NftCard nft={nft} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
