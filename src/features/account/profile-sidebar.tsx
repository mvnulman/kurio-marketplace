import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  MapPin,
  ShoppingBag,
  Tag,
  User,
} from 'lucide-react'

import { useAuth } from '@/features/auth/auth-provider'
import { cn } from '@/lib/utils'

import { notifyOutOfScope } from '@/components/common/out-of-scope'

const LINKS = [
  { label: 'Dados do perfil', to: '/profile' as const, icon: User, match: '/profile' },
  { label: 'Carteiras', to: '/profile/wallets' as const, icon: MapPin, match: '/profile/wallets' },
  { label: 'Atividade', to: '/orders' as const, icon: ShoppingBag, match: '/orders' },
]

const OUT_OF_SCOPE = [
  { label: 'Lista de interesse', icon: Heart, feature: 'Lista de interesse' },
  { label: 'Ofertas', icon: Tag, feature: 'Ofertas' },
  { label: 'Arquivos baixados', icon: Download, feature: 'Arquivos baixados' },
  { label: 'Suporte', icon: LifeBuoy, feature: 'Suporte' },
]

export function ProfileSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <nav
      aria-label="Seções do perfil"
      className="border-border/60 bg-card/40 rounded-xl border p-4 lg:sticky lg:top-24 lg:self-start"
    >
      <h1 className="text-sm font-bold">Meu perfil</h1>
      <ul className="scrollbar-slim mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((item) => {
          const active = location.pathname.startsWith(item.match)
          return (
            <li key={item.to} className="shrink-0">
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-[11px] transition-colors',
                  active
                    ? 'bg-surface-dark text-foreground border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-accent',
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}

        {OUT_OF_SCOPE.map((item) => (
          <li key={item.label} className="shrink-0">
            <button
              type="button"
              onClick={() => notifyOutOfScope(item.feature)}
              className="text-muted-foreground hover:text-accent flex items-center gap-2.5 rounded-md px-3 py-2 text-[11px]"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          </li>
        ))}

        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-border/60 lg:pt-2">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                await logout()
                await navigate({ to: '/' })
              })()
            }}
            className="text-muted-foreground hover:text-destructive flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[11px]"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
