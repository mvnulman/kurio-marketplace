import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import { env } from '@/lib/env'

async function bootstrap(): Promise<void> {
  // A camada de mocks precisa estar ativa antes do primeiro request da aplicação,
  // mas os chunks podem ser baixados em paralelo para acelerar o boot.
  const appPromise = import('@/router')
  const mocksPromise = env.enableMocks
    ? import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker())
    : Promise.resolve()

  await mocksPromise
  const { App } = await appPromise

  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root não encontrado')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
