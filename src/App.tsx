import { useSession } from '@/hooks'
import { AppHeader } from '@/components'
import { Login } from '@/views/auth/Login'
import { DocTrackerProvider } from './contexts/DocTrackerProvider'
import { AppContent } from './AppContent'

export const App = (): JSX.Element => {
  const { jwt } = useSession()

  if (!jwt) {
    return <div className='relative flex h-screen flex-col'>
      <Login />
    </div>
  }

  return (
    <div className='relative flex h-screen flex-col'>
      <div className='grid grid-cols-12 divide-x-2 h-screen'>
        <DocTrackerProvider>
          <AppContent />
        </DocTrackerProvider>
      </div>

      <div className='absolute top-0 left-0 z-10'>
        <AppHeader />
      </div>

    </div>
  )
}
