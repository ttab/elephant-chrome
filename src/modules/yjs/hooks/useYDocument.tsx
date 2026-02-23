import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createTypedYDoc, stringToYPath } from '@/shared/yUtils'
import { useYValue } from './useYValue'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import type { YAwarenessUser } from './useYAwareness'
import type { EleDocumentResponse } from '@/shared/types'
import createHash from '@/shared/createHash'
import type { CollaborationClient } from '../classes/CollaborationClient'
import { useIsOnline } from './useIsOnline'
import { useClientRegistry } from './useClientRegistry'
import { findDescriptionIndex } from '@/views/Planning/hooks/useDescriptionIndex'
import type { Block } from '@ttab/elephant-api/newsdoc'

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
    skipIndexedDB?: boolean
    visibility?: boolean
    rootMap?: string
    ignoreChangeKeys?: string[]
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
  const [isChanged, setIsChangedState] = useState(document.current.getMap('ctx')?.get('isChanged') as boolean ?? false)
  const [descriptions] = useYValue<Block[]>(document.current.getMap(rootMap), 'meta.core/description')

  const internalDescriptionIndex = useMemo(() => {
    if (isChanged) return

    return findDescriptionIndex(descriptions, 'internal')
  }, [descriptions, isChanged])

  /**
   * Client lifecycle - get client and release on unmount
   */
  useEffect(() => {
    if (!id || !clientRegistry) return

    void clientRegistry.get(id, { document: document.current, skipIndexedDB: options?.skipIndexedDB })
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
  }, [id, options?.skipIndexedDB, clientRegistry])

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

  const setIsChanged = useCallback((value: boolean) => {
    const yCtx = document.current.getMap('ctx')
    if (yCtx?.get('isChanged') !== value) {
      yCtx?.set('isChanged', value)
    }

    setIsChangedState((currValue) => {
      return currValue !== value ? value : currValue
    })
  }, [])

  // The effective Y.Doc: use the client's shared document when available,
  // fall back to the initial local document. For the first view opening a
  // document the client's doc IS the local doc (same reference), so effects
  // that depend on this won't re-run unnecessarily. For a second view of
  // the same document the client returns a different (shared) doc, causing
  // effects to re-subscribe to the correct Y.Doc.
  const effectDoc = client?.getDocument() ?? document.current

  /**
   * Observe changes to the ele root map (the actual document) and set the isChange flag
   * to true if the calculated hash is different from the existing one.
   * Ignore paths that are specified in options.ignoreChangeKeys
   */
  useEffect(() => {
    if (!effectDoc) return

    const yCtx = effectDoc.getMap('ctx')
    const yEle = effectDoc.getMap(rootMap)

    const onChange = (events: Y.YEvent<Y.Map<unknown>>[]) => {
      if (isChanged) return

      if (events[0] instanceof Y.YMapEvent) {
        // Ignore if only meta, links, root and content changed (document initialization)
        const ev = events[0] as Y.YMapEvent<Y.Map<unknown>>
        const keys = ev.keysChanged
        if (keys.size === 4 && ['meta', 'links', 'root', 'content'].every((k) => keys.has(k))) {
          return
        }
      }

      const oldHash = yCtx.get('hash')
      const newHash = createHash(yEle)

      // No change in hash, ignore
      if (newHash === oldHash) {
        return
      }

      // Check if we should ignore this change based on keys changed
      if (options?.ignoreChangeKeys?.length) {
        for (const ignoreChangedKey of options.ignoreChangeKeys) {
          const ignoreKeys = stringToYPath(ignoreChangedKey)

          const isMatch = ignoreKeys.every((key, index) => {
            // Handle wildcard match
            if (key === '*') {
              return true
            }

            // Handle inserted variable
            if (key === '@internalDescriptionIndex') {
              return internalDescriptionIndex === events[0].path[index]
            }

            // Handle direct match
            if (events[0].path[index] !== undefined) {
              return key === events[0].path[index]
            }

            // Finally, check if this key was changed in this event
            if (events[0] instanceof Y.YMapEvent) {
              const changedKeys = (events[0] as Y.YMapEvent<Y.Map<unknown>>).keysChanged
              return changedKeys.has(key.toString())
            }
          })

          if (isMatch) {
            return
          }
        }
      }

      setIsChanged(true)
    }

    yEle.observeDeep(onChange)

    return () => {
      yEle.unobserveDeep(onChange)
    }
  }, [effectDoc, isChanged, setIsChanged, rootMap, options?.ignoreChangeKeys, internalDescriptionIndex])

  /**
   * Observe changes to the ctx root map and set the local state accordingly.
   */
  useEffect(() => {
    if (!effectDoc) return
    const yCtx = effectDoc.getMap('ctx')

    const onChange = () => {
      const newValue = yCtx.get('isChanged') as boolean ?? false
      setIsChangedState((currValue) => {
        return currValue !== newValue ? newValue : currValue
      })
    }

    yCtx.observeDeep(onChange)

    return () => {
      yCtx.unobserveDeep(onChange)
    }
  }, [effectDoc])

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
