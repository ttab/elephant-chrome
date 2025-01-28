import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { Login } from '../../views'
import { LoadingText } from '../LoadingText'
import { View } from '../View'
import { useSession } from 'next-auth/react'
import { CoreAuthorProvider } from '../../datastore/contexts/CoreAuthorProvider'
import { CoreCategoryProvider } from '../../datastore/contexts/CoreCategoryProvider'
import { CoreOrganiserProvider } from '../../datastore/contexts/CoreOrganiserProvider'
import { CoreSectionProvider } from '../../datastore/contexts/CoreSectionProvider'
import { CoreStoryProvider } from '../../datastore/contexts/CoreStoryProvider'
import { TTWireSourceProvider } from '../../datastore/contexts/TTWireSourceProvider'
import { DocTrackerProvider, UserTrackerProvider } from '../../contexts'
import { useRegistry } from '@/hooks/useRegistry'
import { initializeAuthor } from './lib/actions/author'
import { initializeFaro } from './lib/actions/faro'

interface InitState {
  faro: boolean | undefined
  author: boolean | undefined
}

export const Init = ({ children }: PropsWithChildren): JSX.Element => {
  const { data: session, status } = useSession()
  const { repository, server: { faroUrl, indexUrl } } = useRegistry()
  const [isInitialized, setIsInitialized] = useState<InitState>({
    faro: undefined,
    author: undefined
  })

  if (status === 'loading') {
    return (
      <View.Root>
        <View.Content>
          <div className='flex items-center justify-center h-screen'>
            <div className='flex-col w-1/3'>
              <LoadingText>Hämtar session...</LoadingText>
            </div>
          </div>
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


  if (isInitialized.faro === undefined) {
    setIsInitialized((prevState) => ({ ...prevState, faro: false }))

    initializeFaro({
      url: faroUrl

    }).catch((error) => {
      throw new Error('Failed to initialize faro', { cause: error })
    }).finally(() => {
      setIsInitialized((prevState) => ({ ...prevState, faro: true }))
    })
  }

  if (isInitialized.author === undefined
    && indexUrl
    && session
    && repository) {
    setIsInitialized((prevState) => ({ ...prevState, author: false }))
    initializeAuthor({
      url: indexUrl,
      repository,
      session
    }).catch((error) => {
      throw new Error('Failed to initialize author', { cause: error })
    }).finally(() => {
      setIsInitialized((prevState) => ({ ...prevState, author: true }))
    })
  }


  return (
    <UserTrackerProvider>
      <DocTrackerProvider>
        <CoreSectionProvider>
          <CoreAuthorProvider>
            <CoreStoryProvider>
              <CoreCategoryProvider>
                <CoreOrganiserProvider>
                  <TTWireSourceProvider>
                    {children}
                  </TTWireSourceProvider>
                </CoreOrganiserProvider>
              </CoreCategoryProvider>
            </CoreStoryProvider>
          </CoreAuthorProvider>
        </CoreSectionProvider>
      </DocTrackerProvider>
    </UserTrackerProvider>
  )
}
