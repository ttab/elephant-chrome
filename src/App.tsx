import { useSession } from 'next-auth/react'
import { AppHeader } from '@/components'
import { DocTrackerProvider } from './contexts/DocTrackerProvider'
import { AppContent } from './AppContent'
import { Login } from './views'
import { CoreAuthorProvider } from './datastore/contexts/CoreAuthorProvider'
import { CoreStoryProvider } from './datastore/contexts/CoreStoryProvider'
import { CoreSectionProvider } from './datastore/contexts/CoreSectionProvider'
import { CoreCategoryProvider } from './datastore/contexts/CoreCategoryProvider'
import { CoreOrganiserProvider } from './datastore/contexts/CoreOrganiserProvider'
import { ModalProvider } from './components/Modal/ModalProvider'

export const App = (): JSX.Element => {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <p>loading...</p>
  }

  if (status === 'unauthenticated' || !session || session.error) {
    const callbackUrl = window.location.href.replace(window.location.origin, '')
    return (
      <div className='relative flex h-screen flex-col'>
        <Login callbackUrl={callbackUrl} />
      </div>
    )
  }


  return (
    <DocTrackerProvider>
      <CoreSectionProvider>
        <CoreAuthorProvider>
          <CoreStoryProvider>
            <CoreCategoryProvider>
              <CoreOrganiserProvider>

                <ModalProvider>
                  <div className='relative flex h-screen flex-col'>
                    <div className='grid grid-cols-12 divide-x-2 h-screen'>
                      <AppContent />
                    </div>

                    <div className='absolute top-0 left-0'>
                      <AppHeader />
                    </div>
                  </div>
                </ModalProvider>

              </CoreOrganiserProvider>
            </CoreCategoryProvider>
          </CoreStoryProvider>
        </CoreAuthorProvider>
      </CoreSectionProvider>
    </DocTrackerProvider>
  )
}
