import { AppHeader } from '@/components/App/Header'
import { AppContent } from './AppContent'
import { EnvironmentBanner } from './components/App/EnvironmentBanner'
import { ModalProvider } from './components/Modal/ModalProvider'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error as ErrorPage } from './views'
import { getEnvironment } from '@/shared/getEnvironment'
import type { JSX } from 'react'

export const App = (): JSX.Element => {
  const environment = getEnvironment()

  return (
    <FaroErrorBoundary fallback={(error) => <ErrorPage error={error} />}>

      <ModalProvider>
        <div className='flex flex-col h-screen'>
          {(!environment || environment !== 'production') && <EnvironmentBanner environment={typeof environment === 'string' ? environment : undefined} />}
          <div className='relative flex flex-1 min-h-0 overflow-hidden'>
            <div className='grid grid-cols-12 flex-1'>
              <AppContent />
            </div>

            <div className='absolute top-0 left-0'>
              <AppHeader />
            </div>
          </div>
        </div>
      </ModalProvider>
    </FaroErrorBoundary>
  )
}
