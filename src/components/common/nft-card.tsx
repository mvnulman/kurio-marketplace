import { Link } from '@tanstack/react-router'

import { FavoriteButton } from '@/components/common/favorite-button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '@/lib/contracts/catalog'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

const RARITY_LABEL: Record<Nft['rarity'], string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
}

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const soldOut = !nft.editions.isOpen || nft.editions.available === 0

  return (
    <article className="group flex flex-col">
      <div className="border-border/60 bg-card relative overflow-hidden rounded-xl border">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          aria-label={`Ver ${nft.name}`}
          className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="bg-surface aspect-square overflow-hidden">
            <img
              src={nft.imageUrl}
              alt={`${nft.name} — obra da coleção ${nft.collection.name}`}
              width={720}
              height={720}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              className={cn(
                'size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                soldOut && 'opacity-60',
              )}
            />
          </div>
        </Link>

        {nft.rarity !== 'comum' ? (
          <Badge className="pointer-events-none absolute top-3 left-3">
            {RARITY_LABEL[nft.rarity]}
          </Badge>
        ) : null}

        <FavoriteButton
          nftId={nft.id}
          nftName={nft.name}
          favorite={Boolean(nft.isFavorite)}
          className="absolute top-2.5 right-2.5"
        />

        {soldOut ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white uppercase">
              Edição esgotada
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-medium">
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              className="hover:text-accent transition-colors"
            >
              {nft.name}
            </Link>
          </h3>
          <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
            {nft.collection.name} · {nft.editions.available}/{nft.editions.total} edições
          </p>
        </div>
        <p className="text-accent shrink-0 text-xs font-bold tabular-nums">
          {formatEth(nft.priceEth)}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  )
}

