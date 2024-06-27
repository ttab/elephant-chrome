import { createContext, useEffect, useState } from 'react'
import { useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'

interface RepositoryEventsProviderState {
  eventSource?: EventSource
}

interface EBCCMessage {
  msg: string
  payload?: unknown
}

export const RepositoryEventsProviderContext = createContext<RepositoryEventsProviderState>({})

export const RepositoryEventsProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { repositoryEventsUrl } } = useRegistry()
  const { data } = useSession()
  const [isLeader, setIsLeader] = useState(true)

  // Handle broadcasted messages (browser tab leadership election)
  useEffect(() => {
    const ebcc = new BroadcastChannel('elephant-bcc')

    const closeHandler = (): void => {
      if (isLeader) {
        ebcc.postMessage({ msg: 'leader:exit' })
      }
      ebcc.close()
    }

    const messageHandler = (event: MessageEvent<EBCCMessage>): void => {
      switch (event.data.msg) {
        case 'leader:exit':
          // The leader has left the building, request leadership,
          // use variable timeout to avoid race conditions.
          setTimeout(() => {
            setIsLeader(true)
            ebcc.postMessage({ msg: 'leader:request' })
          }, Math.round(Math.random() * 100))
          break

        case 'leader:request':
          // Another tab requested leadership
          if (isLeader) {
            ebcc.postMessage({ msg: 'leader:exist' })
          }
          break

        case 'leader:exist':
          // Another tab was already the leader
          setIsLeader(false)
          break
      }
    }

    // Start listening and request leadership
    ebcc.addEventListener('message', messageHandler)
    ebcc.postMessage({ msg: 'leader:request' })

    window.addEventListener('beforeunload', closeHandler)

    return () => {
      window.removeEventListener('beforeunload', closeHandler)
      ebcc.close()
    }
  }, [isLeader])


  // Listen and react to Server Sent Events in leading tab
  useEffect(() => {
    if (!isLeader || !repositoryEventsUrl || !data?.accessToken) {
      return
    }

    // Create url
    const url = new URL(repositoryEventsUrl)
    url.searchParams.set('topic', 'core/author')
    url.searchParams.set('token', data.accessToken)

    // Listen for messages
    const eventSource = new window.EventSource(url.toString())

    // FIXME: Implement handling of author updates and clear (update?) IDB authors object store
    eventSource.onmessage = (event: MessageEvent<unknown>) => {
      console.log(event.data)
    }

    return () => {
      eventSource.close()
    }
  }, [repositoryEventsUrl, data?.accessToken, isLeader])

  return (
    <RepositoryEventsProviderContext.Provider value={{}}>
      {children}
    </RepositoryEventsProviderContext.Provider>
  )
}
