import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/money'

export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="container-page pt-6">
      <div className="border-border/60 relative overflow-hidden rounded-2xl border">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(130%_120%_at_12%_0%,#4b2c18_0%,#261710_42%,#150e0b_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(232,155,85,0.22),transparent_65%)]"
        />

        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-accent text-[10px] tracking-[0.24em] uppercase">Bem-vindo à Kurio</p>
            <h1
              id="hero-title"
              className="mt-4 max-w-xl text-3xl leading-[1.08] font-bold tracking-[-0.02em] uppercase sm:text-4xl xl:text-5xl"
            >
              Seja dono do futuro da arte digital
            </h1>
            <p className="text-muted-foreground mt-5 max-w-md text-xs leading-relaxed sm:text-sm">
              Descubra NFTs selecionados de criadores emergentes e consagrados. A sua coleção de
              arte digital verificada.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#catalogo">Explorar</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/nft/$nftId" params={{ nftId: 'nft-01' }}>
                  Ver destaque
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-3" aria-hidden="true">
              <span className="bg-primary h-1.5 w-6 rounded-full" />
              <span className="bg-border-soft size-1.5 rounded-full" />
              <span className="bg-border-soft size-1.5 rounded-full" />
            </div>
          </div>

          <div className="relative order-first lg:order-last">
            <div className="border-border/60 relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-xl border shadow-2xl">
              <img
                src="/assets/nfts/ape-01.webp"
                alt="Emerald Ape: primata de jaqueta verde usando óculos escuros e colar de jade"
                width={720}
                height={720}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex justify-between p-3">
                <Badge variant="solid">Edição aberta</Badge>
                <Badge variant="outline" className="bg-background/60 backdrop-blur">
                  Ethereum
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                <p className="text-[10px] tracking-[0.14em] text-white/70 uppercase">
                  Destaque da semana
                </p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Emerald Ape #042</p>
                    <p className="text-[10px] text-white/70">Kurio Apes</p>
                  </div>
                  <p className="text-accent text-sm font-bold">{formatEth('1.19')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

