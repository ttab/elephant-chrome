import { AppHeader } from '@/components'
import { AppContent } from './AppContent'
import { ModalProvider } from './components/Modal/ModalProvider'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error as ErrorPage } from './views'
const isProd = !window.location.hostname.includes('stage')

export const App = (): JSX.Element => (
  <>
    <FaroErrorBoundary
      fallback={(error) => <ErrorPage error={error} />}
    >
      <ModalProvider>
        <div className='relative flex h-screen flex-col'>
          {!isProd && (
            <div style={{
              background: 'red',
              width: '100vw',
              display: 'flex',
              height: '5px',
              position: 'absolute',
              top: 0,
              zIndex: 50
            }}
            />
          )}

          <div className='grid grid-cols-12 h-screen'>
            <AppContent />
          </div>

          <div className='absolute top-0 left-0'>
            <AppHeader />
          </div>
        </div>
      </ModalProvider>
    </FaroErrorBoundary>
  </>
)
