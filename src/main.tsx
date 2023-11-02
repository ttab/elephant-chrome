import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { NavigationProvider, ThemeProvider, ApiProvider } from '@/contexts'

const apiProtocol = import.meta.env.VITE_PROTOCOL
const apiHost = import.meta.env.VITE_API_HOST
const apiPort = import.meta.env.VITE_API_PORT

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    < ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
      <ApiProvider protocol={apiProtocol} host={apiHost} port={apiPort}>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </ApiProvider>
    </ThemeProvider >
  </React.StrictMode>
)
