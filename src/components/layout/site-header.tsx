import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { LogOut, Menu, Search, ShoppingBag, User, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Logo } from '@/components/common/logo'
import { OutOfScope } from '@/components/common/out-of-scope'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/auth-provider'
import { cartItemCount, useCartQuery } from '@/features/cart/queries'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Início', to: '/' as const, hash: undefined, match: 'home' },
  { label: 'Mercado', to: '/' as const, hash: 'catalogo', match: 'market' },
]

const globalSearchSchema = z.object({
  q: z.string().trim().min(1, 'Digite um termo para buscar.').max(80, 'Máximo de 80 caracteres.'),
})

function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if ((event.key === '/' && !isTyping) || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = term.trim()

    if (!trimmed) {
      setOpen(false)
      return
    }
    const parsed = globalSearchSchema.safeParse({ q: trimmed })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Termo de busca inválido.')
      return
    }

    setOpen(false)
    void navigate({
      to: '/',
      search: { q: parsed.data.q },
      hash: 'catalogo',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Buscar NFTs">
          <Search aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 max-w-xl translate-y-0">
        <DialogHeader>
          <DialogTitle>Buscar no marketplace</DialogTitle>
          <DialogDescription>
            Procure por obra, coleção, criador ou atributo. Pressione Ctrl/⌘ + K para abrir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex gap-2" role="search">
          <label htmlFor="global-search" className="sr-only">
            Termo de busca
          </label>
          <Input
            id="global-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Emerald Ape, Kurio, fotografia…"
            autoFocus
            maxLength={80}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { data: cart } = useCartQuery()
  const count = cartItemCount(cart)

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        to="/cart"
        onClick={onNavigate}
        aria-label={count > 0 ? `Carrinho, ${count} itens` : 'Carrinho'}
      >
        <ShoppingBag aria-hidden="true" />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
          >
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function AccountMenu() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isLoading) {
    return <div className="bg-card size-9 animate-pulse rounded-full" aria-hidden="true" />
  }

  if (!user) {
    return (
      <Button asChild size="sm" className="hidden sm:inline-flex">
        <Link
          to="/login"
          search={{ redirect: `${location.pathname}${location.searchStr}` }}
        >
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-full focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Menu da conta de ${user.displayName}`}
        >
          <Avatar>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-xs lg:inline">{user.username}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="size-4" aria-hidden="true" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile/wallets">
            <Wallet className="size-4" aria-hidden="true" /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/orders">
            <ShoppingBag className="size-4" aria-hidden="true" /> Pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void (async () => {
              await logout()
              await navigate({ to: '/' })
            })()
          }}
        >
          <LogOut className="size-4" aria-hidden="true" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" title="Menu" description="Navegação do marketplace">
        <nav aria-label="Menu principal" className="flex flex-col p-4">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              onClick={close}
              className="border-border/60 hover:text-accent border-b py-3 text-xs tracking-[0.1em] uppercase"
            >
              {item.label}
            </Link>
          ))}
          <OutOfScope
            feature="Criadores"
            className="border-border/60 text-muted-foreground hover:text-accent border-b py-3 text-left text-xs tracking-[0.1em] uppercase"
          >
            Criadores <span className="text-[9px]">(em breve)</span>
          </OutOfScope>
          <OutOfScope
            feature="Aprenda"
            className="border-border/60 text-muted-foreground hover:text-accent border-b py-3 text-left text-xs tracking-[0.1em] uppercase"
          >
            Aprenda <span className="text-[9px]">(em breve)</span>
          </OutOfScope>

          <div className="mt-6 space-y-2">
            {user ? (
              <>
                <Button asChild variant="secondary" className="w-full" onClick={close}>
                  <Link to="/profile">Meu perfil</Link>
                </Button>
                <Button asChild variant="outline" className="w-full" onClick={close}>
                  <Link to="/orders">Meus pedidos</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full" onClick={close}>
                  <Link to="/login" search={{ redirect: location.pathname }}>
                    Entrar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" onClick={close}>
                  <Link to="/register" search={{ redirect: location.pathname }}>
                    Criar conta
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export function SiteHeader() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((item) => {
              const active = item.match === 'home' ? isHome : !isHome
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'hover:text-accent relative py-5 text-[11px] tracking-[0.12em] uppercase transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="bg-primary absolute inset-x-0 bottom-3 h-px"
                    />
                  ) : null}
                </Link>
              )
            })}
            <OutOfScope
              feature="Criadores"
              className="text-muted-foreground hover:text-accent text-[11px] tracking-[0.12em] uppercase"
            >
              Criadores
            </OutOfScope>
            <OutOfScope
              feature="Aprenda"
              className="text-muted-foreground hover:text-accent text-[11px] tracking-[0.12em] uppercase"
            >
              Aprenda
            </OutOfScope>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <CartButton />
          <AccountMenu />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
