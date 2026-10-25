import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: '/' | '/cart' | '/checkout' | '/orders' | '/profile' | '/profile/wallets'
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[10px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-accent transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-foreground/80">
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight className="size-3" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
