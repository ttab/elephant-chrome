import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, ApiProvider, SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/index.tsx'
import { banner } from './lib/banner.ts'
import { RegistryProvider } from './contexts/RegistryProvider.tsx'

banner()

const host = import.meta.env.VITE_HOST
const port = import.meta.env.VITE_PORT

const websocketUrl = new URL('/ws', `ws://${host}:${port}`)
const indexUrl = new URL(import.meta.env.VITE_INDEX_URL)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SessionProvider>
    <ApiProvider websocketUrl={websocketUrl} indexUrl={indexUrl}>
      <React.StrictMode>
        <RegistryProvider>
          <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
            <NavigationProvider>
              <App />
            </NavigationProvider>
          </ThemeProvider >
        </RegistryProvider>
      </React.StrictMode>
    </ApiProvider>
  </SessionProvider>
)
