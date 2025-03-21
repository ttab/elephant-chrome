import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, RegistryProvider, HPWebSocketProvider, UserTrackerProvider } from '@/contexts'
import { SessionProvider } from './contexts/SessionProvider'
import { banner } from './lib/banner.ts'
import { IndexedDBProvider } from './datastore/contexts/IndexedDBProvider.tsx'
import { SupportedLanguagesProvider } from './datastore/contexts/SupportedLanguagesProvider.tsx'
import { RepositoryEventsProvider } from './contexts/RepositoryEventsProvider.tsx'
import { Init } from './components/Init/index.tsx'
import { UserMessagesSender } from './components/UserMessagesSender.tsx'

banner()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <IndexedDBProvider>
    <RegistryProvider>
      <HPWebSocketProvider>
        <SessionProvider>
          <RepositoryEventsProvider>
            <SupportedLanguagesProvider>
              <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme'>
                <UserTrackerProvider>
                  <Init>
                    <UserMessagesSender>
                      <App />
                    </UserMessagesSender>
                  </Init>
                </UserTrackerProvider>
              </ThemeProvider>
            </SupportedLanguagesProvider>
          </RepositoryEventsProvider>
        </SessionProvider>
      </HPWebSocketProvider>
    </RegistryProvider>
  </IndexedDBProvider>
)
