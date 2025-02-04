import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import { ThemeProvider, RegistryProvider, HPWebSocketProvider } from '@/contexts'
import { SessionProvider } from 'next-auth/react'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { banner } from './lib/banner.ts'
import { RepositoryEventsProvider } from './contexts/RepositoryEventsProvider.tsx'
import { IndexedDBProvider } from './datastore/contexts/IndexedDBProvider.tsx'
import { SupportedLanguagesProvider } from './datastore/contexts/SupportedLanguagesProvider.tsx'
import { SharedWorkerProvider } from './contexts/SharedWorkerProvider.tsx'

banner()

// if ('SharedWorker' in window) {
//   const worker = new SharedWorker('/shared-worker.js')
//   worker.port.onmessage = (event) => {
//     console.log('Event from SharedWorker:', event.data)
//   }

//   worker.port.postMessage('ping')
//   worker.port.start()

//   worker.onerror = (ev) => {
//     console.log(ev)
//   }
// } else {
//   console.error('SharedWorker is not supported in this browser')
// }

const root = document.getElementById('root')

if (!root) {
  throw new Error('Can not getElementById("root")')
}

ReactDOM.createRoot(root).render(
  <IndexedDBProvider>
    <RegistryProvider>
      <HPWebSocketProvider>
        <SessionProvider refetchOnWindowFocus={false} basePath={`${import.meta.env.BASE_URL}/api/auth`} refetchInterval={150}>
          <SharedWorkerProvider>
            <RepositoryEventsProvider>
              <SupportedLanguagesProvider>
                <ThemeProvider defaultTheme='light' storageKey='ele-ui-theme'>
                  <NavigationProvider>
                    <App />
                  </NavigationProvider>
                </ThemeProvider>
              </SupportedLanguagesProvider>
            </RepositoryEventsProvider>
          </SharedWorkerProvider>
        </SessionProvider>
      </HPWebSocketProvider>
    </RegistryProvider>
  </IndexedDBProvider>
)
