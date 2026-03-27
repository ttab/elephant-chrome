import { AppHeader } from '@/components/App/Header'
import { AppContent } from './AppContent'
import { EnvironmentBanner } from './components/App/EnvironmentBanner'
import { ModalProvider } from './components/Modal/ModalProvider'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { Error as ErrorPage } from './views'
import { useFeatureFlags } from './hooks/useFeatureFlags'
import type { JSX } from 'react'

export const App = (): JSX.Element => {
  const { environment } = useFeatureFlags(['environment'])

  return (
    <FaroErrorBoundary fallback={(error) => <ErrorPage error={error} />}>
      <ModalProvider>
        {stageBanner && <EnvironmentBanner />}
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
  )
}
