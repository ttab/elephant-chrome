import { createContext, useMemo } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'

/*
 * TODO: This is now a mix of two things, listening to events and fetching categories
 */
interface RepositoryEventsProviderState {
  eventSource?: EventSource
}

export const RepositoryEventsProviderContext = createContext<RepositoryEventsProviderState>({})

export const RepositoryEventsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()

  const eventSource = useMemo(() => {
    if (!repositoryEventsUrl || !data?.accessToken) {
      return
    }

    // Create url
    const url = new URL(repositoryEventsUrl)
    url.searchParams.set('topic', 'firehose') // FIXME: Should not specific type, ie core/author
    url.searchParams.set('token', data.accessToken)

    // Listen for messages
    const eventSource = new window.EventSource(url.toString())

    // FIXME: Implement handling of author updates and clear (update?) IDB authors object store
    eventSource.onmessage = (event: MessageEvent<unknown>) => {
      console.log(event.data)
    }

    return eventSource
  }, [repositoryEventsUrl, data?.accessToken])

  return (
    <RepositoryEventsProviderContext.Provider value={{ eventSource }}>
      {children}
    </RepositoryEventsProviderContext.Provider>
  )
}
