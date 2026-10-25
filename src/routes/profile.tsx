import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  component: ProfileLayoutPlaceholder,
})

function ProfileLayoutPlaceholder() {
  return (
    <div className="container-page py-10">
      <Outlet />
    </div>
  )
}
