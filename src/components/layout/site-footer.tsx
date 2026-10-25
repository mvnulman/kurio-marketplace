import { Link } from '@tanstack/react-router'
import { ArrowRight, Music2 } from 'lucide-react'
import { useState } from 'react'

import {
  InstagramMark,
  XMark,
  YoutubeMark,
} from '@/components/common/brand-icons'
import { Logo } from '@/components/common/logo'
import { notifyOutOfScope, OutOfScope } from '@/components/common/out-of-scope'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PROMO_CARDS = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e coleção com autenticação e sessão verificadas.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas e comunidades que moldam a cultura digital.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de lançamentos e novidades do mercado.',
  },
]

const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]

const CATEGORY_LINKS = [
  { label: 'Arte digital', category: 'arte-digital' },
  { label: 'Fotografia', category: 'fotografia' },
  { label: 'Música', category: 'musica' },
  { label: 'Arte 3D', category: 'arte-3d' },
  { label: 'Utilidade', category: 'utilidade' },
]

function NewsletterForm() {
  const [email, setEmail] = useState('')

  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        setEmail('')
        notifyOutOfScope('Newsletter')
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail
      </label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail…"
          className="h-10"
        />
        <Button type="submit" size="sm" className="shrink-0">
          Enviar
        </Button>
      </div>
      <p className="text-muted-foreground/70 text-[10px] leading-relaxed">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-border/60 mt-24 border-t">
      <div className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROMO_CARDS.map((card) => (
            <div
              key={card.initial}
              className="border-border/60 bg-card/50 flex gap-4 rounded-lg border p-5"
            >
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {card.initial}
              </span>
              <div>
                <h2 className="text-xs font-bold tracking-[0.04em]">{card.title}</h2>
                <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}

          <div className="border-border/60 bg-card/50 rounded-lg border p-5">
            <h2 className="text-xs font-bold">Antecipe-se ao próximo lançamento</h2>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-border/60 mt-10 grid gap-4 border-y py-6 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
          <Logo asLink={false} />
          <p className="text-muted-foreground">Feito para colecionadores, criadores e cultura.</p>
          <a href="mailto:contato@kurio.art" className="text-muted-foreground hover:text-accent">
            contato@kurio.art
          </a>
          <a href="tel:+551140028922" className="text-muted-foreground hover:text-accent lg:text-right">
            +55 11 4002 8922
          </a>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="footer-account">
            <h2
              id="footer-account"
              className="text-[11px] font-bold tracking-[0.1em] uppercase"
            >
              Minha conta
            </h2>
            <ul className="mt-4 space-y-2 text-[11px]">
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-accent">
                  Meu perfil
                </Link>
              </li>
              <li>
                <Link to="/profile/wallets" className="text-muted-foreground hover:text-accent">
                  Minhas carteiras
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-muted-foreground hover:text-accent">
                  Atividade e pedidos
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-muted-foreground hover:text-accent">
                  Carrinho
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="text-[11px] font-bold tracking-[0.1em] uppercase">
              Central de ajuda
            </h2>
            <ul className="mt-4 space-y-2 text-[11px]">
              {HELP_LINKS.map((label) => (
                <li key={label}>
                  <OutOfScope
                    feature={label}
                    className="text-muted-foreground hover:text-accent text-left"
                  >
                    {label}
                  </OutOfScope>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-collections">
            <h2
              id="footer-collections"
              className="text-[11px] font-bold tracking-[0.1em] uppercase"
            >
              Coleções
            </h2>
            <ul className="mt-4 space-y-2 text-[11px]">
              {CATEGORY_LINKS.map((item) => (
                <li key={item.category}>
                  <Link
                    to="/"
                    search={{ cat: item.category }}
                    hash="catalogo"
                    className="text-muted-foreground hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase">Redes sociais</h2>
            <div className="mt-4 flex gap-2">
              {[
                { label: 'Instagram', icon: InstagramMark },
                { label: 'X (Twitter)', icon: XMark },
                { label: 'YouTube', icon: YoutubeMark },
                { label: 'TikTok', icon: Music2 },
              ].map((social) => (
                <OutOfScope key={social.label} feature={social.label}>
                  <span className="border-border/70 text-muted-foreground hover:text-accent flex size-8 items-center justify-center rounded border">
                    <social.icon className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">{social.label}</span>
                  </span>
                </OutOfScope>
              ))}
            </div>

            <h2 className="mt-6 flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase">
              Carteiras compatíveis
              <ArrowRight className="size-3" aria-hidden="true" />
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {['MetaMask', 'WalletConnect', 'Coinbase'].map((wallet) => (
                <Badge key={wallet} variant="outline">
                  {wallet}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mt-12 text-center text-[10px]">
          © 2026 Kurio. Propriedade digital para todos. Projeto de demonstração.
        </p>
      </div>
    </footer>
  )
}
