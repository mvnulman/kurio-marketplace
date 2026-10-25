import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  )
}

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Erro 404</p>
      <h1 className="mt-3 text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        O endereço acessado não existe neste marketplace.
      </p>
    </div>
  )
}
