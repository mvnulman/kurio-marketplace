import { createFileRoute } from '@tanstack/react-router'

import { AuthPage } from '@/features/auth/auth-page'
import { authSearchSchema } from '@/features/auth/search'

export const Route = createFileRoute('/register')({
  validateSearch: (search) => authSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Criar conta — KURIO' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()
  return <AuthPage mode="register" search={search} />
}
