import { useLocation, useNavigate } from '@tanstack/react-router'
import { Heart, Loader2 } from 'lucide-react'

import { useAuth } from '@/features/auth/auth-provider'
import { useToggleFavorite } from '@/features/favorites/mutations'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  nftId,
  nftName,
  favorite,
  className,
  size = 'default',
  withLabel = false,
}: {
  nftId: string
  nftName: string
  favorite: boolean
  className?: string
  size?: 'default' | 'lg'
  withLabel?: boolean
}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toggle = useToggleFavorite()

  const onClick = () => {
    if (!isAuthenticated) {
      void navigate({
        to: '/login',
        search: { redirect: `${location.pathname}${location.searchStr}` },
      })
      return
    }
    toggle.mutate({ nftId, favorite: !favorite })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorite}
      aria-label={favorite ? `Remover ${nftName} dos favoritos` : `Adicionar ${nftName} aos favoritos`}
      aria-busy={toggle.isPending}
      disabled={toggle.isPending}
      className={cn(
        'bg-background/70 hover:bg-background focus-visible:ring-ring inline-flex items-center justify-center border backdrop-blur transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait',
        withLabel
          ? 'h-10 gap-2 rounded-md px-4 text-[10px] font-medium tracking-[0.08em] uppercase'
          : 'rounded-full',
        !withLabel && (size === 'lg' ? 'size-10' : 'size-8'),
        className,
      )}
    >
      {toggle.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          aria-hidden="true"
          className={cn(
            size === 'lg' ? 'size-5' : 'size-4',
            favorite ? 'fill-accent text-accent' : 'text-foreground',
          )}
        />
      )}
      {withLabel ? <span>{favorite ? 'Favoritado' : 'Favoritar'}</span> : null}
    </button>
  )
}
