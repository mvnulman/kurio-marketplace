import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { NftCard } from '@/components/common/nft-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Nft } from '@/lib/contracts/catalog'
import { formatEth } from '@/lib/money'

export function FeaturedSection({ nfts }: { nfts: Nft[] }) {
  const [main, ...others] = nfts
  if (!main) return null

  return (
    <section aria-labelledby="featured-title" className="container-page mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent text-[10px] tracking-[0.2em] uppercase">NFT em destaque</p>
          <h2 id="featured-title" className="mt-1 text-lg font-bold tracking-tight">
            Oferta limitada
          </h2>
        </div>
        <Link
          to="/"
          search={{ sort: 'recent' }}
          hash="catalogo"
          className="text-muted-foreground hover:text-accent inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase"
        >
          Ver todos <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="group border-border/60 relative overflow-hidden rounded-xl border">
          <Link to="/nft/$nftId" params={{ nftId: main.id }} className="block">
            <img
              src={main.imageUrl}
              alt={`${main.name} — obra em destaque`}
              width={720}
              height={720}
              loading="lazy"
              decoding="async"
              className="aspect-[16/11] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] lg:aspect-auto lg:h-full"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <Badge>Oferta limitada</Badge>
              <h3 className="mt-3 text-lg font-bold">{main.name}</h3>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
                {main.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-accent text-lg font-bold">{formatEth(main.priceEth)}</p>
                <span className="text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                  {main.editions.available} de {main.editions.total} disponíveis
                </span>
              </div>
            </div>
          </Link>
        </article>

        <div className="grid grid-cols-2 gap-4">
          {others.slice(0, 4).map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function PromoBanners() {
  return (
    <section className="container-page mt-20 grid gap-4 md:grid-cols-2" aria-label="Destaques editoriais">
      <article className="border-border/60 relative overflow-hidden rounded-xl border">
        <img
          src="/assets/nfts/ape-03.webp"
          alt=""
          width={720}
          height={720}
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="from-background/95 via-background/60 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="relative max-w-sm p-8">
          <p className="text-accent text-[10px] tracking-[0.2em] uppercase">Lançamentos do mês</p>
          <h2 className="mt-2 text-xl leading-snug font-bold">
            Obras recém-chegadas ao mercado
          </h2>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
            Curadoria semanal com edições abertas, artistas emergentes e coleções verificadas.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-5">
            <Link to="/" search={{ sort: 'recent' }} hash="catalogo">
              Explorar lançamentos
            </Link>
          </Button>
        </div>
      </article>

      <article className="border-border/60 relative overflow-hidden rounded-xl border">
        <img
          src="/assets/nfts/ape-07.webp"
          alt=""
          width={720}
          height={720}
          loading="lazy"
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="from-background/95 via-background/60 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="relative max-w-sm p-8">
          <p className="text-accent text-[10px] tracking-[0.2em] uppercase">Arte digital</p>
          <h2 className="mt-2 text-xl leading-snug font-bold">
            Peças selecionadas para a sua coleção
          </h2>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
            Do generativo à fotografia: encontre o estilo que conversa com a sua identidade.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-5">
            <Link to="/" search={{ cat: 'arte-digital' }} hash="catalogo">
              Explorar arte digital
            </Link>
          </Button>
        </div>
      </article>
    </section>
  )
}

const DIARY = [
  {
    author: 'Ana Kurio',
    title: 'Da abstração à identidade',
    image: '/assets/nfts/ape-12.webp',
    search: { q: 'Ana Kurio' },
  },
  {
    author: 'Studio Vega',
    title: 'Como escolher a primeira obra',
    image: '/assets/nfts/ape-08.webp',
    search: { q: 'Studio Vega' },
  },
  {
    author: 'Miro Lume',
    title: 'Colecionar como prática cultural',
    image: '/assets/nfts/ape-16.webp',
    search: { q: 'Miro Lume' },
  },
  {
    author: 'Ona Beats',
    title: 'Som, imagem e propriedade',
    image: '/assets/nfts/ape-05.webp',
    search: { q: 'Ona Beats' },
  },
] as const

export function CollectorDiary() {
  return (
    <section aria-labelledby="diary-title" className="container-page mt-20">
      <div className="text-center">
        <p className="text-accent text-[10px] tracking-[0.2em] uppercase">Diário de Coleção</p>
        <h2 id="diary-title" className="mt-2 text-xl font-bold tracking-tight">
          Histórias de quem coleciona
        </h2>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DIARY.map((entry) => (
          <article
            key={entry.title}
            className="group border-border/60 bg-card/40 overflow-hidden rounded-xl border"
          >
            <Link
              to="/"
              search={entry.search}
              hash="catalogo"
              aria-label={`Ver obras de ${entry.author}`}
              className="block focus-visible:outline-none"
            >
              <img
                src={entry.image}
                alt=""
                width={720}
                height={720}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </Link>
            <div className="p-4">
              <p className="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">
                {entry.author}
              </p>
              <h3 className="mt-2 text-xs leading-snug font-bold">{entry.title}</h3>
              <Link
                to="/"
                search={entry.search}
                hash="catalogo"
                className="text-accent mt-3 inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase"
              >
                Ver obras <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

