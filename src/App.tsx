import { AppHeader } from '@/components'
import { AppContent } from './AppContent'
import { ModalProvider } from './components/Modal/ModalProvider'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error as ErrorPage } from './views'
import { Toaster } from '@ttab/elephant-ui'

export const App = (): JSX.Element => (
  <>
    <FaroErrorBoundary
      fallback={(error) => <ErrorPage error={error} />}
    >
      <ModalProvider>
        <div className='relative flex h-screen flex-col'>
          <div className='grid grid-cols-12 h-screen'>
            <AppContent />
          </div>

          <div className='absolute top-0 left-0'>
            <AppHeader />
          </div>
        </div>
      </ModalProvider>
    </FaroErrorBoundary>

    <Toaster />
  </>
)
