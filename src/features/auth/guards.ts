import { redirect } from '@tanstack/react-router'

import { sessionTokenStorage } from '@/lib/storage'

/**
 * Guarda de rotas privadas: sem token local vai para o login preservando o
 * destino. Com token expirado, os requests respondem 401 e o tratamento global
 * recolhe o contexto e redireciona.
 */
export function requireSession(location: { pathname: string; searchStr: string }): void {
  if (sessionTokenStorage.get()) return

  throw redirect({
    to: '/login',
    search: { redirect: `${location.pathname}${location.searchStr}` },
  })
}
