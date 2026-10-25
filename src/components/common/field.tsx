import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase"
        >
          {label}
          {optional ? null : (
            <span aria-hidden="true" className="text-accent ml-0.5">
              *
            </span>
          )}
        </label>
        {optional ? <span className="text-muted-foreground/70 text-[10px]">Opcional</span> : null}
      </div>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-muted-foreground/80 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
