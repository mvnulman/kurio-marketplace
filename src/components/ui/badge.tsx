import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/40 bg-primary/15 text-accent',
        solid: 'border-primary bg-primary text-primary-foreground',
        outline: 'border-border-soft bg-transparent text-muted-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        success: 'border-success/40 bg-success/15 text-success',
        destructive: 'border-destructive/40 bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
