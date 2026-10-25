import { Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function PagePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="container-page py-20">
      <div className="border-border/60 bg-card/40 mx-auto max-w-xl rounded-xl border p-8 text-center">
        <Construction className="text-primary mx-auto size-8" aria-hidden="true" />
        <p className="text-accent mt-4 text-[10px] tracking-[0.2em] uppercase">Em construção</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-3 text-sm">{description}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Voltar ao marketplace</Link>
        </Button>
      </div>
    </div>
  )
}
