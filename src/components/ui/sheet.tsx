import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

type SheetSide = 'top' | 'right' | 'bottom' | 'left'

const sideStyles: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b data-[state=open]:animate-slide-down',
  bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:animate-slide-up',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
  right: 'inset-y-0 right-0 h-full w-full border-l sm:max-w-lg',
}

function SheetContent({
  className,
  children,
  side = 'right',
  showClose = true,
  title,
  description,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  side?: SheetSide
  showClose?: boolean
  title: string
  description?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'bg-background fixed z-50 flex flex-col shadow-2xl',
          'max-h-dvh overflow-y-auto',
          sideStyles[side],
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="space-y-1">
            <DialogPrimitive.Title className="text-base font-bold tracking-[0.08em] uppercase">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-muted-foreground text-xs">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {showClose && (
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetTrigger }
