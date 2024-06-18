import { createContext, useEffect, useMemo } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Authors } from '@/lib/index/authors'

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
  const { server: { indexUrl, repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()

  const eventSource = useMemo(() => {
    if (!repositoryEventsUrl || !data?.accessToken) {
      return
    }

    // Create url
    const url = new URL(repositoryEventsUrl)
    url.searchParams.set('topic', 'firehose') // FIXME: Should not be firehose!!!
    url.searchParams.set('token', data.accessToken)

    // Listen for messages
    const eventSource = new window.EventSource(url.toString())
    eventSource.onmessage = (event) => {
      // console.log(event.data)
    }

    return eventSource
  }, [repositoryEventsUrl, data?.accessToken])


  useEffect(() => {
    async function fetchAuthors(): Promise<void> {
      if (!data?.accessToken || !indexUrl) {
        return
      }

      const authors = await Authors.get(new URL(indexUrl), data.accessToken)
      // console.log(authors)
    }

    void fetchAuthors()
  })


  return (
    <RepositoryEventsProviderContext.Provider value={{ eventSource }}>
      {children}
    </RepositoryEventsProviderContext.Provider>
  )
}
