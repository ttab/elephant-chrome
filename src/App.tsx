import { useSession } from 'next-auth/react'
import { AppHeader } from '@/components'
import { DocTrackerProvider } from './contexts/DocTrackerProvider'
import { AppContent } from './AppContent'
import { AuthorsProvider } from './contexts/AuthorsProvider'

export const App = (): JSX.Element => {
  const { status } = useSession()

  if (status === 'loading') {
    return <p>loading...</p>
  }

  return (
    <div className='relative flex h-screen flex-col'>
      <div className='grid grid-cols-12 divide-x-2 h-screen'>
        <AuthorsProvider>
          <DocTrackerProvider>
            <AppContent />
          </DocTrackerProvider>
        </AuthorsProvider>
      </div>

      <div className='absolute top-0 left-0 z-10'>
        <AppHeader />
      </div>

    </div>
  )
}
