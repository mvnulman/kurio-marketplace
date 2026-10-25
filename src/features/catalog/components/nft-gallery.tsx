import { useState } from 'react'

import { FavoriteButton } from '@/components/common/favorite-button'
import type { Nft } from '@/lib/contracts/catalog'
import { cn } from '@/lib/utils'

export function NftGallery({ nft }: { nft: Nft }) {
  const images = nft.gallery.length > 0 ? nft.gallery : [nft.imageUrl]
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex] ?? nft.imageUrl

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div
        role="group"
        aria-label="Miniaturas da obra"
        className="scrollbar-slim flex gap-2 overflow-x-auto md:max-h-[520px] md:flex-col md:overflow-y-auto"
      >
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver imagem ${index + 1} de ${images.length}`}
            aria-pressed={index === activeIndex}
            className={cn(
              'relative size-16 shrink-0 overflow-hidden rounded-md border transition-opacity focus-visible:outline-none',
              index === activeIndex
                ? 'border-primary opacity-100'
                : 'border-border/60 opacity-60 hover:opacity-100',
            )}
          >
            <img
              src={image}
              alt=""
              width={720}
              height={720}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="border-border/60 bg-card relative min-w-0 flex-1 overflow-hidden rounded-xl border">
        <div className="aspect-square md:aspect-auto md:h-full">
          <img
            src={activeImage}
            alt={`${nft.name} — imagem ${activeIndex + 1} de ${images.length}`}
            width={720}
            height={720}
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
        <FavoriteButton
          nftId={nft.id}
          nftName={nft.name}
          favorite={Boolean(nft.isFavorite)}
          size="lg"
          className="absolute top-3 right-3"
        />
        {nft.editions.isOpen && nft.editions.available > 0 ? (
          <span className="bg-background/70 absolute bottom-3 left-3 rounded-full border px-3 py-1 text-[10px] tracking-[0.08em] uppercase backdrop-blur">
            {nft.editions.available} disponíveis
          </span>
        ) : null}
      </div>
    </div>
  )
}

