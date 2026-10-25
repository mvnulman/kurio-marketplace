import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

export function StarRating({
  value,
  count,
  size = 'sm',
  className,
}: {
  value: number
  count?: number
  size?: 'sm' | 'lg'
  className?: string
}) {
  const rounded = Math.round(value)
  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="img"
      aria-label={`Avaliação média ${value.toFixed(1).replace('.', ',')} de 5${
        count !== undefined ? `, ${count} avaliações` : ''
      }`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              size === 'lg' ? 'size-4' : 'size-3',
              index < rounded ? 'fill-accent text-accent' : 'text-border-soft',
            )}
          />
        ))}
      </span>
      <span
        aria-hidden="true"
        className={cn('text-muted-foreground tabular-nums', size === 'lg' ? 'text-xs' : 'text-[10px]')}
      >
        {value.toFixed(1).replace('.', ',')}
        {count !== undefined ? ` (${count})` : ''}
      </span>
    </div>
  )
}
