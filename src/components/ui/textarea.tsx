import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-surface placeholder:text-muted-foreground/60 flex min-h-24 w-full rounded-md border px-4 py-3 text-sm',
        'focus-visible:border-primary focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
