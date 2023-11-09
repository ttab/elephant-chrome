import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { NavigationProvider, ThemeProvider, ApiProvider, SessionProvider } from '@/contexts'

const protocol = import.meta.env.VITE_PROTOCOL
const host = import.meta.env.VITE_API_HOST
const port = import.meta.env.VITE_API_PORT
const apiUrl = `${protocol}://${host}:${port}/api`
const websocketUrl = `ws://${host}:${port}/ws`
const indexUrl = import.meta.env.VITE_INDEX_URL

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SessionProvider endpoint={`${apiUrl}/user`}>
    <ApiProvider apiUrl={new URL(apiUrl)} websocketUrl={new URL(websocketUrl)} indexUrl={new URL(indexUrl)}>
      <React.StrictMode>
        < ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </ThemeProvider >
      </React.StrictMode>
    </ApiProvider>
  </SessionProvider>
)
