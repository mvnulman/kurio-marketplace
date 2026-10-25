import { createFileRoute, Outlet } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { ProfileSidebar } from '@/features/account/profile-sidebar'
import { requireSession } from '@/features/auth/guards'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ location }) => requireSession(location),
  head: () => ({ meta: [{ title: 'Meu perfil — KURIO' }] }),
  component: ProfileLayout,
})

function ProfileLayout() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Meu perfil' }]}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <ProfileSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
