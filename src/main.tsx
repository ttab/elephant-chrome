import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, RegistryProvider, HPWebSocketProvider } from '@/contexts'
import { SessionProvider } from 'next-auth/react'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { banner } from './lib/banner.ts'
import { RepositoryEventsProvider } from './contexts/RepositoryEventsProvider.tsx'
import { IndexedDBProvider } from './datastore/contexts/IndexedDBProvider.tsx'

banner()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <IndexedDBProvider>
    <RegistryProvider>
      <HPWebSocketProvider>
        <SessionProvider refetchOnWindowFocus={false} basePath={`${import.meta.env.BASE_URL}/api/auth`} refetchInterval={150}>
          <RepositoryEventsProvider>
            <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme' >
              <NavigationProvider>
                <App />
              </NavigationProvider>
            </ThemeProvider >
          </RepositoryEventsProvider>
        </SessionProvider>
      </HPWebSocketProvider>
    </RegistryProvider>
  </IndexedDBProvider>
)
