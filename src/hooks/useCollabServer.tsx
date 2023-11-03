import { useMemo, useState } from 'react'
import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import { useSession } from '.'
import { useApi } from './useApi'

/**
 * Returns a new Hocuspocus Provider for given document id and whether it has a connection or not
 *
 * @param documentId
 * @returns [HocuspocusProvider, boolean]
 */
export const useCollaboration = (documentId: string): [HocuspocusProvider | undefined, boolean] => {
  const [jwt = undefined] = useSession()
  const { hocuspocusWebsocket = undefined } = useApi()

  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)

  const hpProvider = useMemo(() => {
    if (!hocuspocusWebsocket || !jwt?.access_token) {
      console.warn('Could not create Hocuspocus provider due to no valid session')
      return undefined
    }

    return new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
      token: jwt.access_token as string,
      onAuthenticationFailed: ({ reason }) => {
        console.warn(reason)
      },
      onAuthenticated: () => {
        console.info('Authenticated')
      },
      onSynced: ({ state }) => {
        if (state) {
          console.info('Synced')
          setConnectionStatus(WebSocketStatus.Connected)
        }
      },
      onStatus: ({ status }) => {
        if (status === 'disconnected') {
          console.warn('Lost connection')
          setConnectionStatus(WebSocketStatus.Disconnected)
        }
      }
    })
  }, [documentId, hocuspocusWebsocket, jwt])

  return [hpProvider, connectionStatus === WebSocketStatus.Connected]
}
