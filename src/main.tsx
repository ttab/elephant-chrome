import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, RegistryProvider } from '@/contexts'
import { SessionProvider } from './contexts/SessionProvider'
import { banner } from './lib/banner.ts'
import { IndexedDBProvider } from './datastore/contexts/IndexedDBProvider.tsx'
import { SupportedLanguagesProvider } from './datastore/contexts/SupportedLanguagesProvider.tsx'
import { RepositoryEventsProvider } from './contexts/RepositoryEventsProvider.tsx'
import { Init } from './components/Init/index.tsx'
import { UserMessagesReceiver } from './components/UserMessagesReceiver.tsx'
import { Toaster } from '@ttab/elephant-ui'
import './index.css'

banner()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <>
    <IndexedDBProvider>
      <RegistryProvider>
        <SessionProvider>
          <RepositoryEventsProvider>
            <SupportedLanguagesProvider>
              <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme'>
                <Init>
                  <UserMessagesReceiver>
                    <App />
                  </UserMessagesReceiver>
                </Init>
              </ThemeProvider>
            </SupportedLanguagesProvider>
          </RepositoryEventsProvider>
        </SessionProvider>
      </RegistryProvider>
    </IndexedDBProvider>

    <Toaster />
  </>
)
