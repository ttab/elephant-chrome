import { useState, useEffect, useRef, useCallback } from 'react'
import type * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { createTypedYDoc } from '../lib/yjs'
import { useWebSocket } from './useWebSocket'
import { useYValue } from './useYValue'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import type { YAwarenessUser } from './useYAwareness'
import type { EleDocumentResponse } from '@/shared/types'

export interface YDocument<T> {
  id: string
  document: T
  meta: Y.Map<unknown>
  connected: boolean
  synced: boolean
  online: boolean
  isReady: boolean
  setIsReady: (isReady: boolean) => void
  isChanged: boolean
  setIsChanged: (isChanged: boolean) => void
  transact: (f: (arg0: Y.Map<T>, arg1: Y.Transaction) => void) => void
  send: (key: string, payload: unknown) => Promise<void> | undefined
  provider: HocuspocusProvider | null // FIXME: Deprecated! Should be removed in favor of useYDocument logic
  user: YAwarenessUser | null
}

/**
 * Create an IndexeddbPersistence provider and when synced also create
 * a HocuspocusProvider. Manage synced and connected state towards the
 * HocuspocusServer.
 */
export function useYDocument<T>(
  id: string,
  options?: {
    data?: EleDocumentResponse
    persistent?: boolean
    invisible?: boolean
  }
): YDocument<T> {
  const rootMap = 'ele'
  const { data: session } = useSession()
  const { userColor } = useRegistry()
  const { isConnected: connected, isOnline: online, websocketProvider } = useWebSocket()
  const [indexedDB, setIndexedDB] = useState<IndexeddbPersistence | null>(null)
  const [synced, setSynced] = useState(false)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const userRef = useRef<YAwarenessUser | null>(null)
  const resultRef = useRef<YDocument<T>>({} as YDocument<T>)

  if (!userRef.current || userRef.current.name !== session?.user.name || userRef.current.color !== userColor) {
    userRef.current = {
      name: session?.user.name ?? '',
      initials: session?.user.name.split(' ').map((t) => t.substring(0, 1)).join('') ?? '',
      color: userColor,
      avatar: undefined
    }
  }

  // Create yjs document
  const [document] = useState<Y.Doc>(createTypedYDoc(options?.data, {
    rootMap,
    isInProgress: !!options?.data
  }))

  // Whether document is ready to be saved to repository (is valid)
  const [isReady, setIsReady] = useYValue<boolean>(document.getMap('__meta'), ['isReady'])
  const [isChanged, setIsChanged] = useYValue<boolean>(document.getMap('__meta'), ['isChanged'])

  // IndexedDB lifecycle
  useEffect(() => {
    const indexeddb = new IndexeddbPersistence(id, document)
    setIndexedDB(indexeddb)

    return () => {
      if (isReady && !options?.persistent && providerRef.current?.hasUnsyncedChanges === false) {
        void indexeddb.clearData() // Clearing from IndexedDB
      } else {
        void indexeddb.destroy() // Keeps doc in IndexedDB
      }
    }
  }, [id, document, options?.persistent, isReady])

  // Hocuspocus lifecycle
  useEffect(() => {
    if (!session?.accessToken || !websocketProvider || !indexedDB) {
      return
    }

    providerRef.current = new HocuspocusProvider({
      websocketProvider,
      name: id,
      document,
      token: session?.accessToken,
      onSynced: ({ state }) => {
        setSynced(state)
        startSyncedPolling()
      }
    })

    // Clear synced status polling callback
    const clearSyncedPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Start synced status polling callback
    const startSyncedPolling = () => {
      // Clear any existing interval
      clearSyncedPolling()

      // Start polling until synced
      intervalRef.current = setInterval(() => {
        const currentSynced = !providerRef.current?.hasUnsyncedChanges
        setSynced(currentSynced)

        // Stop polling once synced
        if (currentSynced && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }, 200)
    }

    // Attach to websocket once indexeddb is synced for polling to work
    void indexedDB.whenSynced.then(() => {
      providerRef.current?.attach()
      document.on('update', startSyncedPolling)

      if (options?.invisible !== true) {
        // Awareness on
        providerRef.current?.setAwarenessField('data', userRef.current)
        providerRef.current?.setAwarenessField('focus', { key: id, color: userRef.current?.color })
      }
    })

    return () => {
      // Clean up polling
      document.off('update', startSyncedPolling)
      clearSyncedPolling()

      if (options?.invisible !== true) {
        // Awareness off
        providerRef.current?.setAwarenessField('focus', undefined)
      }

      // Clean up providers
      providerRef.current?.detach()
      providerRef.current?.destroy()
    }
  }, [document, id, websocketProvider, indexedDB, options?.invisible, session?.accessToken])

  // Utility function to send stateless messages
  const send = useCallback((key: string, payload: unknown) => {
    if (!providerRef.current) {
      return Promise.resolve()
    }

    const msg = `${key}@${JSON.stringify(payload)}`
    providerRef.current?.sendStateless(msg)
  }, [providerRef])

  // Refresh access token when needed
  useEffect(() => {
    if (!providerRef.current) {
      return
    }

    void send('auth', {
      accessToken: session?.accessToken || ''
    })
  }, [send, session?.accessToken])

  // Utility function to perform multiple actions as one transaction on this document
  const transact = useCallback((f: (arg0: Y.Map<T>, arg1: Y.Transaction) => void) => {
    document.transact((tr) => {
      const map = document.getMap(rootMap)
      f(map as Y.Map<T>, tr)
    })
  }, [document])

  resultRef.current.id = id
  resultRef.current.document = document.getMap(rootMap) as T
  resultRef.current.meta = document.getMap('__meta')
  resultRef.current.connected = connected && online
  resultRef.current.synced = synced
  resultRef.current.online = online
  resultRef.current.isReady = isReady ?? false
  resultRef.current.setIsReady = setIsReady
  resultRef.current.isChanged = isChanged ?? false
  resultRef.current.setIsChanged = setIsChanged
  resultRef.current.transact = transact
  resultRef.current.send = send
  resultRef.current.provider = providerRef.current
  resultRef.current.user = userRef.current

  return resultRef.current
}
