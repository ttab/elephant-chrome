import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CoreAuthorProvider } from '../../datastore/contexts/CoreAuthorProvider'
import { CoreCategoryProvider } from '../../datastore/contexts/CoreCategoryProvider'
import { CoreOrganiserProvider } from '../../datastore/contexts/CoreOrganiserProvider'
import { CoreSectionProvider } from '../../datastore/contexts/CoreSectionProvider'
import { CoreStoryProvider } from '../../datastore/contexts/CoreStoryProvider'
import { TTWireSourceProvider } from '../../datastore/contexts/TTWireSourceProvider'
import { TTEditorialInfoTypeProvider } from '../../datastore/contexts/TTEditorialInfoTypeProvider'
import { DocTrackerProvider } from '../../contexts'
import { useRegistry } from '@/hooks/useRegistry'
import { initializeAuthor } from './lib/actions/author'
import { initializeFaro } from './lib/actions/faro'
import type { QueryParams } from '@/hooks/useQuery'
import { useUserTracker } from '@/hooks/useUserTracker'
import { LoadingText } from '../LoadingText'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { View } from '../View'

interface InitState {
  faro: boolean | undefined
  author: boolean | undefined
  userTracker: boolean | undefined
}

export const Init = ({ children }: PropsWithChildren): JSX.Element => {
  const { data: session } = useSession()
  const [, , synced] = useUserTracker<Record<string, QueryParams> | undefined>(`filters`)

  const { repository, server: { faroUrl, indexUrl } } = useRegistry()
  const [isInitialized, setIsInitialized] = useState<InitState>({
    faro: undefined,
    author: undefined,
    userTracker: undefined
  })

  useEffect(() => {
    if (synced && isInitialized.userTracker === undefined) {
      setIsInitialized((prevState) => ({ ...prevState, userTracker: true }))
    }
  }, [synced, isInitialized.userTracker])

  useEffect(() => {
    if (isInitialized.faro === undefined) {
      setIsInitialized((prevState) => ({ ...prevState, faro: false }))

      initializeFaro({
        url: faroUrl
      }).catch((error) => {
        console.error('Failed to initialize faro', error)
      }).finally(() => {
        setIsInitialized((prevState) => ({ ...prevState, faro: true }))
      })
    }
  }, [isInitialized.faro, faroUrl])

  useEffect(() => {
    if (isInitialized.author === undefined && indexUrl && session && repository) {
      setIsInitialized((prevState) => ({ ...prevState, author: false }))
      initializeAuthor({
        url: indexUrl,
        repository,
        session
      }).catch((error) => {
        console.error('Failed to initialize author', error)
      }).finally(() => {
        setIsInitialized((prevState) => ({ ...prevState, author: true }))
      })
    }
  }, [isInitialized.author, indexUrl, session, repository])

  if (Object.values(isInitialized).some((value) => value !== true)) {
    return (
      <View.Root>
        <View.Content>
          <div className='flex items-center justify-center h-screen'>
            <div className='flex flex-col w-1/3'>
              <LoadingText>Hämtar användardata...</LoadingText>

              <div className='flex flex-col items-center justify-center gap-2 mt-4'>
                {Object.entries(isInitialized).map(([key, value]) => {
                  return (
                    <span key={key}>
                      {key}
                      {' '}
                      {value ? '✔️' : '...'}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </View.Content>
      </View.Root>
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
                  <TTEditorialInfoTypeProvider>
                    <NavigationProvider>
                      {children}
                    </NavigationProvider>
                  </TTEditorialInfoTypeProvider>
                </TTWireSourceProvider>
              </CoreOrganiserProvider>
            </CoreCategoryProvider>
          </CoreStoryProvider>
        </CoreAuthorProvider>
      </CoreSectionProvider>
    </DocTrackerProvider>
  )
}
