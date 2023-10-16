import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { NavigationProvider } from '@/contexts/navigation'

import { ThemeProvider } from '@/contexts/theme-provider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme'>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  </React.StrictMode>
)
