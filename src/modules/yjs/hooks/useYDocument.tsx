import { useState, useEffect, useRef, useCallback } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createTypedYDoc } from '@/shared/yUtils'
import { useYValue } from './useYValue'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import type { YAwarenessUser } from './useYAwareness'
import type { EleDocumentResponse } from '@/shared/types'
import createHash from '@/shared/createHash'
import type { CollaborationClient } from '../classes/CollaborationClient'
import { useIsOnline } from './useIsOnline'
import { useClientRegistry } from './useClientRegistry'

export interface YDocument<T> {
  id: string
  ele: T
  ctx: Y.Map<unknown>
  connected: boolean
  synced: boolean
  online: boolean
  visibility: boolean
  isInProgress: boolean
  setIsInProgress: (isInProgress: boolean) => void
  isChanged: boolean
  setIsChanged: (isChanged: boolean) => void
  transact: (f: (arg0: Y.Map<T>, arg1: Y.Transaction) => void) => void
  send: (key: string, payload: unknown) => void
  provider: HocuspocusProvider | null
  user: YAwarenessUser | null
}

/**
 * Create an IndexeddbPersistence provider and when synced also create
 * a HocuspocusProvider. Manage synced and connected state towards the
 * HocuspocusServer.
 *
 * Visibility is true by default if not specified.
 */
export function useYDocument<T>(
  id: string,
  options?: {
    data?: EleDocumentResponse
    persistent?: boolean
    visibility?: boolean
    rootMap?: string
  }
): YDocument<T> {
  const { data: session } = useSession()
  const { userColor } = useRegistry()
  const isOnline = useIsOnline()
  const clientRegistry = useClientRegistry()
  const [client, setClient] = useState<CollaborationClient | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const userRef = useRef<YAwarenessUser | null>(null)
  const resultRef = useRef<YDocument<T>>({} as YDocument<T>)

  const rootMap = options?.rootMap || 'ele'

  // Unique identifier for this usage of the document
  const ydocumentId = useRef(crypto.randomUUID())

  // Default visibility is true
  const visibility = options?.visibility ?? true

  /**
   * Create yjs document and subscribe to ready state
   */
  const document = useRef<Y.Doc>(createTypedYDoc(options?.data, {
    isInProgress: !!options?.data,
    rootMap
  }))

  // Whether document is ready to be saved to repository (is valid)
  const [isInProgress, setIsInProgress] = useYValue<boolean>(document.current.getMap('ctx'), 'isInProgress')
  const [isChanged, setIsChanged] = useState(document.current.getMap('ctx')?.get('isChanged') as boolean ?? false)

  /**
   * Client lifecycle - get client and release on unmount
   */
  useEffect(() => {
    if (!id || !clientRegistry) return

    void clientRegistry.get(id, { document: document.current })
      .then((client) => {
        setClient(client)
        // Use the collaboration client's document, not the created
        // local document. This is important when we get a reused client.
        document.current = client.getDocument()
      })

    // Cleanup: release reference when component unmounts
    return () => {
      if (clientRegistry) {
        clientRegistry.release(id)
      }
    }
  }, [id, clientRegistry])

  /**
   * Subscribe to client status changes
   */
  useEffect(() => {
    if (!client) return

    return client.onStatusChange((status) => {
      setIsSynced(status.hpSynced)
      setIsConnected(status.hpOnline)
    })
  }, [client])

  if (!userRef.current || userRef.current.name !== session?.user.name || userRef.current.color !== userColor) {
    if (visibility === true) {
      userRef.current = {
        name: session?.user.name ?? '',
        initials: session?.user.name.split(' ').map((t) => t.substring(0, 1)).join('') ?? '',
        color: userColor,
        avatar: undefined
      }
    }
  }

  /**
   * When we have a user and provider awareness we set the user data field
   */
  useEffect(() => {
    if (!userRef.current || !client) return

    const provider = client?.getProvider?.()
    if (provider) {
      provider.setAwarenessField('data', userRef.current)
    }
  }, [client, userRef])

  /**
   * Observe changes to the ele root map (the actual document) and set the isChange flag
   * to true if the calculated hash is different from the existing one.
   */
  useEffect(() => {
    if (!document.current) return

    const yCtx = document.current.getMap('ctx')
    const yEle = document.current.getMap(rootMap)
    const onChange = () => {
      if (isChanged) return

      const newValue = createHash(JSON.stringify(yEle.toJSON())) !== yCtx.get('hash')
      if (newValue !== isChanged) {
        setIsChanged(newValue)
        yCtx.set('isChanged', newValue)
      }
    }

    yEle.observeDeep(onChange)

    return () => {
      yEle.unobserveDeep(onChange)
    }
  }, [isChanged, setIsChanged, rootMap])

  /**
   * Observe changes to the ctx root map and set the local state accordingly.
   */
  useEffect(() => {
    if (!document.current) return
    const yCtx = document.current.getMap('ctx')

    const onChange = () => {
      const newValue = yCtx.get('isChanged') as boolean ?? false
      setIsChanged((currValue) => {
        return currValue !== newValue ? newValue : currValue
      })
    }

    yCtx.observeDeep(onChange)

    return () => {
      yCtx.unobserveDeep(onChange)
    }
  }, [])

  /**
   * Utility function to send stateless messages
   */
  const send = useCallback((key: string, payload: unknown) => {
    return client?.send(key, payload)
  }, [client])

  /**
   * Utility function to perform multiple actions as one transaction on this document
   */
  const transact = useCallback((f: (arg0: Y.Map<T>, arg1: Y.Transaction) => void) => {
    document.current.transact((tr) => {
      const map = document.current.getMap<T>('document')
      f(map, tr)
    })
  }, [])

  /**
   * Refresh access token when needed
   */
  useEffect(() => {
    const provider = client?.getProvider()
    if (!provider) {
      return
    }

    void send('auth', {
      accessToken: session?.accessToken || ''
    })
  }, [send, client, session?.accessToken])

  /**
   * Turn on visibility if not invisible
   */
  useEffect(() => {
    if (!isConnected) {
      return
    }

    const usageId = ydocumentId.current

    // Turn on visibility for this usage id if not invisible
    if (visibility === true) {
      send('context', {
        visibility: true,
        id,
        usageId
      })
    }

    return () => {
      if (visibility === true) {
        send('context', {
          id,
          usageId
        })
      }
    }
  }, [visibility, isConnected, send, id])

  resultRef.current.id = id
  resultRef.current.ele = document.current.getMap(rootMap) as T
  resultRef.current.ctx = document.current.getMap('ctx')
  resultRef.current.connected = isOnline && isConnected
  resultRef.current.synced = isSynced
  resultRef.current.online = isOnline
  resultRef.current.visibility = visibility
  resultRef.current.isInProgress = isInProgress ?? false
  resultRef.current.setIsInProgress = setIsInProgress
  resultRef.current.isChanged = isChanged ?? false
  resultRef.current.setIsChanged = setIsChanged
  resultRef.current.transact = transact
  resultRef.current.send = send
  resultRef.current.provider = client?.getProvider() ?? null
  resultRef.current.user = userRef.current

  return resultRef.current
}
