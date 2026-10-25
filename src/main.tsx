import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import { App } from '@/router'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
