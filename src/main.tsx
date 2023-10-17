import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import { ThemeProvider } from '@/contexts/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme'>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
