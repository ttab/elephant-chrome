import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, SessionProvider, RegistryProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'
import { banner } from './lib/banner.ts'

banner()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <SessionProvider>
    <React.StrictMode>
      <RegistryProvider>
        <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </ThemeProvider >
      </RegistryProvider>
    </React.StrictMode>
  </SessionProvider>
)
