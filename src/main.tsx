import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, ApiProvider, SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'
import { banner } from './lib/banner.ts'
import { RegistryProvider } from './contexts/RegistryProvider.tsx'

banner()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SessionProvider>
    <ApiProvider>
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
