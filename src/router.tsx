import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider, type ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { AuthProvider } from '@/features/auth/auth-provider'
import { isApiError } from '@/lib/http'

import { routeTree } from './routeTree.gen'

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 15_000,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function RouteError({ error, reset }: ErrorComponentProps) {
  const message = isApiError(error)
    ? error.message
    : 'Ocorreu um erro inesperado ao carregar esta página.'

  return (
    <div className="container-page py-24 text-center">
      <p className="text-accent text-[10px] tracking-[0.24em] uppercase">Algo deu errado</p>
      <h1 className="mt-3 text-2xl font-bold">Não foi possível carregar</h1>
      <p role="alert" className="text-muted-foreground mx-auto mt-3 max-w-md text-sm">
        {message}
      </p>
      <Button className="mt-6" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} context={{ queryClient }} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export { App, queryClient, router }
