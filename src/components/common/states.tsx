import { AlertTriangle, SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-10 text-center">
      <SearchX className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button variant="outline" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/5 rounded-xl border p-10 text-center"
    >
      <AlertTriangle className="text-destructive mx-auto size-8" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-xs leading-relaxed">
        {description}
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
