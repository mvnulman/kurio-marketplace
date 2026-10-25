import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

export function Logo({ className, asLink = true }: { className?: string; asLink?: boolean }) {
  const content = (
    <span className={cn('inline-flex items-baseline gap-1 text-sm font-bold tracking-[0.34em]', className)}>
      KURIO
      <span aria-hidden="true" className="text-accent text-lg leading-none">
        .
      </span>
    </span>
  )

  if (!asLink) return content

  return (
    <Link to="/" aria-label="KURIO — página inicial" className="focus-visible:outline-offset-4">
      {content}
    </Link>
  )
}
