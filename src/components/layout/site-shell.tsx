import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { DemoPanel } from '@/components/common/demo-panel'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function SiteShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <DemoPanel />
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        toastOptions={{ className: 'font-sans text-xs' }}
      />
    </div>
  )
}
