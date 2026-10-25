import { createRootRoute, Link } from '@tanstack/react-router'

import { SiteShell } from '@/components/layout/site-shell'
import { Button } from '@/components/ui/button'

export const Route = createRootRoute({
  component: SiteShell,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [{ title: 'KURIO — Marketplace de NFTs' }],
  }),
})

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-accent text-[10px] tracking-[0.24em] uppercase">Erro 404</p>
      <h1 className="mt-3 text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm">
        O endereço acessado não existe ou o recurso foi removido. Você pode voltar ao catálogo e
        continuar explorando.
      </p>
      <Button asChild className="mt-6">
        <Link to="/" hash="catalogo">
          Ir para o catálogo
        </Link>
      </Button>
    </div>
  )
}
