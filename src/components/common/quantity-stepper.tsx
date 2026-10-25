import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  label = 'Quantidade',
  className,
  compact = false,
}: {
  value: number
  max: number
  min?: number
  onChange: (value: number) => void
  label?: string
  className?: string
  compact?: boolean
}) {
  const disabled = max < min

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'border-border-soft bg-surface inline-flex items-center rounded-md border',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Diminuir quantidade"
        className={cn(
          'text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground flex items-center justify-center p-2 disabled:opacity-40',
          compact ? 'size-8' : 'size-10',
        )}
      >
        <Minus className={compact ? 'size-3' : 'size-4'} aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn(
          'text-center text-xs font-bold tabular-nums',
          compact ? 'min-w-7' : 'min-w-9',
        )}
      >
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Aumentar quantidade"
        className={cn(
          'text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground flex items-center justify-center p-2 disabled:opacity-40',
          compact ? 'size-8' : 'size-10',
        )}
      >
        <Plus className={compact ? 'size-3' : 'size-4'} aria-hidden="true" />
      </button>
    </div>
  )
}
