import { Link, useNavigate } from '@tanstack/react-router'
import { Copy, Loader2, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { FacebookMark, XMark } from '@/components/common/brand-icons'
import { FavoriteButton } from '@/components/common/favorite-button'
import { NftCard } from '@/components/common/nft-card'
import { QuantityStepper } from '@/components/common/quantity-stepper'
import { StarRating } from '@/components/common/star-rating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddToCart } from '@/features/cart/mutations'
import type { Nft, NftReview } from '@/lib/contracts/catalog'
import { NFT_CATEGORIES, NFT_RARITIES } from '@/lib/contracts/catalog'
import { NETWORKS } from '@/lib/contracts/common'
import { formatDate } from '@/lib/format'
import { isApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

import { NftGallery } from './nft-gallery'

const RARITY_LABEL = new Map(NFT_RARITIES.map((item) => [item.id, item.label]))
const CATEGORY_LABEL = new Map(NFT_CATEGORIES.map((item) => [item.id, item.label]))
const NETWORK_LABEL = new Map(NETWORKS.map((item) => [item.id, item.label]))

export function NftDetail({
  nft,
  reviews,
  related,
}: {
  nft: Nft
  reviews: NftReview[]
  related: Nft[]
}) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)

  const available = nft.editions.isOpen ? nft.editions.available : 0
  const soldOut = available <= 0

  useEffect(() => {
    if (available > 0) {
      setQuantity((current) => Math.min(current, available))
    }
  }, [available])

  useEffect(() => {
    document.title = `${nft.name} — KURIO`
  }, [nft.name])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copiado para a área de transferência.')
    } catch {
      toast.error('Não foi possível copiar o link neste navegador.')
    }
  }

  async function handleAddToCart() {
    try {
      await addToCart.mutateAsync({ nftId: nft.id, quantity })
      toast.success(`${quantity} × ${nft.name} adicionado ao carrinho.`, {
        action: {
          label: 'Ver carrinho',
          onClick: () => {
            void navigate({ to: '/cart' })
          },
        },
      })
    } catch (error) {
      toast.error(
        isApiError(error) ? error.message : 'Não foi possível adicionar a obra ao carrinho.',
      )
    }
  }

  return (
    <div className="container-page py-6">
      <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <NftGallery nft={nft} />

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[10px] tracking-[0.08em] uppercase">
                <Link
                  to="/"
                  search={{ col: nft.collection.id }}
                  hash="catalogo"
                  className="text-accent hover:underline"
                >
                  {nft.collection.name}
                </Link>
                {nft.collection.verified ? (
                  <span title="Coleção verificada" aria-label="Coleção verificada">
                    ✓
                  </span>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{nft.creator.name}</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{nft.name}</h1>
            </div>
            <span className="text-muted-foreground shrink-0 text-[10px] tracking-[0.08em] uppercase">
              #{nft.tokenId}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <StarRating value={nft.rating.average} count={nft.rating.count} size="lg" />
            <Badge variant="outline">{RARITY_LABEL.get(nft.rarity)}</Badge>
            <Badge variant="outline">{CATEGORY_LABEL.get(nft.category)}</Badge>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-accent text-2xl font-bold">{formatEth(nft.priceEth)}</p>
            <span className="text-muted-foreground text-[10px]">preço atual</span>
          </div>

          <section aria-labelledby="about-art" className="mt-7">
            <h2
              id="about-art"
              className="text-[10px] font-bold tracking-[0.14em] uppercase"
            >
              Sobre a arte NFT
            </h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{nft.description}</p>
          </section>

          <div className="border-border/60 mt-6 space-y-2 border-y py-4">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground tracking-[0.08em] uppercase">Edições</span>
              <span className="tabular-nums">
                {nft.editions.available} de {nft.editions.total} disponíveis
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Edições vendidas"
              aria-valuemin={0}
              aria-valuemax={nft.editions.total}
              aria-valuenow={nft.editions.minted}
              className="bg-muted h-1 overflow-hidden rounded-full"
            >
              <div
                className="bg-primary h-full rounded-full"
                style={{
                  width: `${Math.min(100, (nft.editions.minted / Math.max(1, nft.editions.total)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {nft.editions.minted} colecionadas
              </span>
              <Badge variant={soldOut ? 'destructive' : 'success'}>
                {soldOut ? 'Esgotada' : 'Edição aberta'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!soldOut ? (
              <QuantityStepper
                value={quantity}
                max={available}
                onChange={setQuantity}
                label="Quantidade desejada"
              />
            ) : null}
            <Button
              onClick={() => {
                void handleAddToCart()
              }}
              disabled={soldOut || addToCart.isPending}
              className="min-w-40 flex-1 sm:flex-none"
            >
              {addToCart.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Adicionando…
                </>
              ) : (
                <>
                  <ShoppingBag aria-hidden="true" />
                  {soldOut ? 'Edição esgotada' : 'Comprar'}
                </>
              )}
            </Button>
            <FavoriteButton
              nftId={nft.id}
              nftName={nft.name}
              favorite={Boolean(nft.isFavorite)}
              withLabel
              className="bg-transparent"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-[10px]">
            {soldOut
              ? 'Todas as unidades desta edição foram colecionadas.'
              : `Limite de ${available} unidades por edição. Você poderá revisar tudo no carrinho.`}
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 text-[11px]">
            <div>
              <dt className="text-muted-foreground">ID do token</dt>
              <dd className="mt-0.5 font-medium">#{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Coleção</dt>
              <dd className="mt-0.5 font-medium">{nft.collection.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criador</dt>
              <dd className="mt-0.5 font-medium">{nft.creator.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rede</dt>
              <dd className="mt-0.5 font-medium">{NETWORK_LABEL.get(nft.network)}</dd>
            </div>
          </dl>

          <div className="border-border/60 mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
              Compartilhar
            </span>
            <button
              type="button"
              onClick={() => {
                void copyLink()
              }}
              aria-label="Copiar link desta obra"
              className="border-border/70 text-muted-foreground hover:text-accent hover:border-primary flex size-8 items-center justify-center rounded border transition-colors"
            >
              <Copy className="size-3.5" aria-hidden="true" />
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no X"
              className="border-border/70 text-muted-foreground hover:text-accent hover:border-primary flex size-8 items-center justify-center rounded border transition-colors"
            >
              <XMark className="size-3.5" />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no Facebook"
              className="border-border/70 text-muted-foreground hover:text-accent hover:border-primary flex size-8 items-center justify-center rounded border transition-colors"
            >
              <FacebookMark className="size-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
            <TabsTrigger value="reviews">
              Avaliações de colecionadores ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-5">
                <div>
                  <h2 className="text-xs font-bold">Sobre esta edição</h2>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {nft.description} A propriedade é registrada de forma permanente e o acesso à
                    arte digital acompanha cada unidade negociada.
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-bold">Direitos e royalties</h2>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    O criador recebe 5% de royalties em vendas secundárias. Os termos são
                    simulados nesta demonstração e não representam um contrato on-chain real.
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-bold">Rede e contrato</h2>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    Emitido na rede {NETWORK_LABEL.get(nft.network)} sob o padrão ERC-721
                    (simulado). Contrato:{' '}
                    <span className="font-mono text-[10px]">0x9a8f…kurio</span>
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold">Atributos</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {nft.attributes.map((attribute) => (
                    <div
                      key={`${attribute.trait}-${attribute.value}`}
                      className="border-border/60 bg-card/40 rounded-md border p-2.5"
                    >
                      <dt className="text-muted-foreground text-[9px] tracking-[0.1em] uppercase">
                        {attribute.trait}
                      </dt>
                      <dd className="mt-1 text-[10px] font-medium">{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <div className="border-border/60 bg-card/40 h-fit rounded-lg border p-5 text-center">
                <p className="text-3xl font-bold">{nft.rating.average.toFixed(1)}</p>
                <StarRating
                  value={nft.rating.average}
                  className="mt-2 justify-center"
                  size="lg"
                />
                <p className="text-muted-foreground mt-2 text-[10px]">
                  {nft.rating.count} avaliações de colecionadores
                </p>
              </div>

              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className={cn('border-border/60 bg-card/30 rounded-lg border p-4')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold">{review.author}</p>
                      <time
                        dateTime={review.createdAt}
                        className="text-muted-foreground text-[10px]"
                      >
                        {formatDate(review.createdAt)}
                      </time>
                    </div>
                    <StarRating value={review.rating} className="mt-2" />
                    <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                      {review.comment}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-accent text-[10px] tracking-[0.2em] uppercase">Curadoria</p>
              <h2 id="related-title" className="mt-1 text-lg font-bold">
                Mais desta coleção
              </h2>
            </div>
            <Link
              to="/"
              search={{ col: nft.collection.id }}
              hash="catalogo"
              className="text-muted-foreground hover:text-accent text-[10px] tracking-[0.08em] uppercase"
            >
              Ver coleção
            </Link>
          </div>

          <div className="scrollbar-slim mt-5 flex snap-x gap-4 overflow-x-auto pb-2">
            {related.map((item) => (
              <div key={item.id} className="w-[190px] shrink-0 snap-start sm:w-[210px]">
                <NftCard nft={item} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
