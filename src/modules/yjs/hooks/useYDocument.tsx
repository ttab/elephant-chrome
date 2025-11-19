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
 */
export function useYDocument<T>(
  id: string,
  options?: {
    data?: EleDocumentResponse
    persistent?: boolean
    invisible?: boolean
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

  /**
   * Create yjs document and subscribe to ready state
   */
  const document = useRef<Y.Doc>(createTypedYDoc(options?.data, {
    isInProgress: !!options?.data
  }))

  // Whether document is ready to be saved to repository (is valid)
  const [isInProgress, setIsInProgress] = useYValue<boolean>(document.current.getMap('ctx'), 'isInProgress')
  const [isChanged, setIsChanged] = useYValue<boolean>(document.current.getMap('ctx'), 'isChanged')

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
    if (!options?.invisible) {
      userRef.current = {
        name: session?.user.name ?? '',
        initials: session?.user.name.split(' ').map((t) => t.substring(0, 1)).join('') ?? '',
        color: userColor,
        avatar: undefined
      }
    }
  }

  /**
   * Observe changes to the ele root map (the actual document) and set the isChange flag
   * to true if the calculated hash is different from the existing one.
   */
  useEffect(() => {
    if (!document.current) return

    const yCtx = document.current.getMap('ctx')
    const yEle = document.current.getMap('ele')
    const onChange = () => {
      if (isChanged) return

      setIsChanged(createHash(JSON.stringify(yEle.toJSON())) !== yCtx.get('hash'))
    }

    yEle.observeDeep(onChange)

    return () => {
      yEle.unobserveDeep(onChange)
    }
  }, [isChanged, setIsChanged])

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

  useEffect(() => {
    if (typeof options?.invisible !== 'boolean') {
      return
    }

    if (!isConnected) {
      return
    }

    send('context', {
      invisible: options.invisible,
      id
    })
  }, [options?.invisible, isConnected, send, id])

  resultRef.current.id = id
  resultRef.current.ele = document.current.getMap('ele') as T
  resultRef.current.ctx = document.current.getMap('ctx')
  resultRef.current.connected = isOnline && isConnected
  resultRef.current.synced = isSynced
  resultRef.current.online = isOnline
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
