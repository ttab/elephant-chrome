import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, ApiProvider, SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'
import { banner } from './lib/banner.ts'

banner()

const protocol = import.meta.env.VITE_PROTOCOL
const host = import.meta.env.VITE_HOST
const port = import.meta.env.VITE_PORT

const apiUrl = new URL('/api', `${protocol}://${host}:${port}`)
const websocketUrl = new URL('/ws', `ws://${host}:${port}`)
const indexUrl = new URL(import.meta.env.VITE_INDEX_URL)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SessionProvider endpoint={new URL('/api/user', apiUrl)}>
    <ApiProvider apiUrl={apiUrl} websocketUrl={websocketUrl} indexUrl={indexUrl}>
      <React.StrictMode>
        <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </ThemeProvider >
      </React.StrictMode>
    </ApiProvider>
  </SessionProvider>
)
