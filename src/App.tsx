import { useSession } from 'next-auth/react'
import { AppHeader, View } from '@/components'
import { DocTrackerProvider } from './contexts/DocTrackerProvider'
import { AppContent } from './AppContent'
import { Login } from './views'
import { CoreAuthorProvider } from './datastore/contexts/CoreAuthorProvider'
import { CoreStoryProvider } from './datastore/contexts/CoreStoryProvider'
import { CoreSectionProvider } from './datastore/contexts/CoreSectionProvider'
import { CoreCategoryProvider } from './datastore/contexts/CoreCategoryProvider'
import { CoreOrganiserProvider } from './datastore/contexts/CoreOrganiserProvider'
import { TTWireSourceProvider } from './datastore/contexts/TTWireSourceProvider'
import { ModalProvider } from './components/Modal/ModalProvider'
import { LoadingText } from './components/LoadingText'

export const App = (): JSX.Element => {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <View.Root>
        <View.Content>
          <LoadingText>Laddar...</LoadingText>
        </View.Content>
      </View.Root>
    )
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
                <TTWireSourceProvider>

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

                </TTWireSourceProvider>
              </CoreOrganiserProvider>
            </CoreCategoryProvider>
          </CoreStoryProvider>
        </CoreAuthorProvider>
      </CoreSectionProvider>
    </DocTrackerProvider>
  )
}
