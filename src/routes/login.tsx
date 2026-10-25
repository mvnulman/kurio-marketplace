import { createFileRoute } from '@tanstack/react-router'

import { AuthPage } from '@/features/auth/auth-page'
import { authSearchSchema } from '@/features/auth/search'

export const Route = createFileRoute('/login')({
  validateSearch: (search) => authSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Entrar — KURIO' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  return <AuthPage mode="login" search={search} />
}
