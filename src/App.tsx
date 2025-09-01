import { AppHeader } from '@/components'
import { AppContent } from './AppContent'
import { ModalProvider } from './components/Modal/ModalProvider'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error as ErrorPage } from './views'
import './index.css'
// const isProd = import.meta.env.VITE_ENV !== 'stage'

export const App = (): JSX.Element => (
  <>
    <FaroErrorBoundary
      fallback={(error) => <ErrorPage error={error} />}
    >
      <ModalProvider>
        <div className='relative flex h-screen flex-col'>
          {/* {!isProd && (
            <div style={{
              background: 'red',
              color: '#f5f5f5',
              width: '100vw',
              fontSize: '8px',
              display: 'flex',
              justifyContent: 'center',
              position: 'sticky',
              top: 0
            }}
            >
              STAGE
            </div>
          )} */}

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
