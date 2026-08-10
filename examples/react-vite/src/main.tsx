import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from 'app/app'
import { AppProviders } from 'app/providers/app-providers'
import 'app/styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
