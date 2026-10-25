import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import { env } from '@/lib/env'

async function bootstrap(): Promise<void> {
  // A camada de mocks precisa estar ativa antes do primeiro request da aplicação.
  if (env.enableMocks) {
    const { startMockWorker } = await import('@/mocks/browser')
    await startMockWorker()
  }

  const { App } = await import('@/router')
  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root não encontrado')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
