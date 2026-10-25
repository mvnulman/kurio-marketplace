import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
