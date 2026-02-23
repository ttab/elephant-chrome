import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { SettingsClient } from '@ttab/elephant-api/user'
import { SettingsContext } from './SettingsContext'
import { AbortError } from '@/shared/types/errors'
import { meta } from '@/shared/meta'
import type { Document as SettingsDocument } from '@ttab/elephant-api/user'
import type { SettingsDocumentPayload, SettingsEventHandler } from './types'
import { useRegistry } from '@/hooks/useRegistry'

interface Subscriber {
  documentType: string
  handler: SettingsEventHandler
}

interface DocumentTypeState {
  settings: SettingsDocument | undefined
  loading: boolean
}

export const SettingsProvider = ({ application, children }: {
  application: string
  children: React.ReactNode
}) => {
  const { server } = useRegistry()
  const { data } = useSession()

  const clientRef = useRef<SettingsClient | null>(null)
  const subscribersRef = useRef(new Set<Subscriber>())
  const stateRef = useRef(new Map<string, DocumentTypeState>())
  const requestedTypesRef = useRef(new Set<string>())
  const fetchRequestsRef = useRef(new Map<string, AbortController>())

  if (!clientRef.current) {
    clientRef.current = new SettingsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', server.userUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )
  }

  const getState = useCallback((documentType: string): DocumentTypeState => {
    return stateRef.current.get(documentType) ?? { settings: undefined, loading: false }
  }, [])

  const setState = useCallback((documentType: string, update: Partial<DocumentTypeState>) => {
    const current = stateRef.current.get(documentType) ?? { settings: undefined, loading: false }
    stateRef.current.set(documentType, { ...current, ...update })
  }, [])

  const notifySubscribers = useCallback((documentType: string, settings: SettingsDocument | undefined) => {
    subscribersRef.current.forEach((subscriber) => {
      if (subscriber.documentType !== documentType) return
      try {
        subscriber.handler(settings)
      } catch (err) {
        console.error('Error in settings subscriber', err)
      }
    })
  }, [])

  /**
   * Fetch settings for a document type.
   * Called lazily when a hook first subscribes to a type, or when polling detects changes.
   */
  const fetchSettings = useCallback(async (
    documentType: string,
    accessToken: string,
    signal: AbortSignal
  ) => {
    const client = clientRef.current
    if (!client) return

    setState(documentType, { loading: true })

    try {
      const { response } = await client.getDocument(
        {
          owner: '',
          application,
          type: documentType,
          key: 'current'
        },
        {
          ...meta(accessToken),
          abort: signal
        }
      )

      if (!signal.aborted) {
        setState(documentType, {
          settings: response.document,
          loading: false
        })

        if (response.document) {
          notifySubscribers(documentType, response.document)
        }
      }
    } catch (err) {
      if (signal.aborted) return

      // 404 is expected when no settings exist
      if (err instanceof Error && 'code' in err && err.code === 'not_found') {
        setState(documentType, { settings: undefined, loading: false })
      } else {
        console.error(`Failed to fetch settings for ${documentType}`, err)
        setState(documentType, { loading: false })
      }

      notifySubscribers(documentType, undefined)
    }
  }, [application, setState, notifySubscribers])

  const updateSettings = useCallback(async (documentType: string, settings: SettingsDocumentPayload) => {
    const client = clientRef.current
    const accessToken = data?.accessToken
    if (!client || !accessToken) {
      throw new Error('Settings client not available')
    }

    const document = {
      owner: '',
      application,
      type: documentType,
      key: 'current',
      schemaVersion: 'v1.0.0',
      payload: settings
    }
    try {
      const options = meta(accessToken)
      await client.updateDocument(
        document,
        options
      )
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }

    // Optimistically update local state and notify subscribers
    setState(documentType, { settings })
    notifySubscribers(documentType, settings)
  }, [application, data?.accessToken, setState, notifySubscribers])

  const subscribe = useCallback((documentType: string, handler: SettingsEventHandler) => {
    const subscriber: Subscriber = { documentType, handler }
    subscribersRef.current.add(subscriber)

    // Trigger initial fetch if this is the first subscriber for this type
    if (!requestedTypesRef.current.has(documentType) && data?.accessToken) {
      requestedTypesRef.current.add(documentType)

      // Abort any existing fetch for this document type
      const existingController = fetchRequestsRef.current.get(documentType)
      if (existingController) {
        existingController.abort()
      }

      const controller = new AbortController()
      fetchRequestsRef.current.set(documentType, controller)

      void fetchSettings(documentType, data.accessToken, controller.signal).finally(() => {
        // Clean up the controller reference after fetch completes
        if (fetchRequestsRef.current.get(documentType) === controller) {
          fetchRequestsRef.current.delete(documentType)
        }
      })
    }

    // If we already have settings, notify immediately
    const current = getState(documentType)
    if (current.settings) {
      try {
        handler(current.settings)
      } catch (err) {
        console.error('Error in settings subscriber', err)
      }
    }

    return () => {
      subscribersRef.current.delete(subscriber)
    }
  }, [data?.accessToken, fetchSettings, getState])

  const getSettings = useCallback((documentType: string): SettingsDocument | undefined => {
    return getState(documentType).settings
  }, [getState])

  // Store fetchSettings in a ref to avoid stale closures in the polling loop
  const fetchSettingsRef = useRef(fetchSettings)
  useEffect(() => {
    fetchSettingsRef.current = fetchSettings
  }, [fetchSettings])

  // Store current access token in a ref for the polling loop
  const accessTokenRef = useRef(data?.accessToken)
  useEffect(() => {
    accessTokenRef.current = data?.accessToken
  }, [data?.accessToken])

  /**
   * Poll for settings event log changes
   */
  useEffect(() => {
    const client = clientRef.current
    const accessToken = data?.accessToken

    if (!accessToken || !client) {
      return
    }

    let isActive = true
    const abortController = new AbortController()

    const poll = async () => {
      let lastEventId = BigInt(-1)

      while (isActive && !abortController.signal.aborted) {
        try {
          // Use the ref to get the current access token
          const currentToken = accessTokenRef.current
          if (!currentToken) {
            break
          }

          const { response } = await client.pollEventLog(
            { afterId: lastEventId },
            { ...meta(currentToken), abort: abortController.signal }
          )

          if (!isActive || abortController.signal.aborted) break

          if (response.lastId > lastEventId) {
            lastEventId = response.lastId
          }

          for (const entry of response.entries) {
            // Re-fetch the updated document type if we're tracking it
            if (entry.documentType && requestedTypesRef.current.has(entry.documentType)) {
              const token = accessTokenRef.current
              if (!token) break

              // Abort any existing fetch for this document type before starting a new one
              const existingController = fetchRequestsRef.current.get(entry.documentType)
              if (existingController) {
                existingController.abort()
              }

              const fetchController = new AbortController()
              fetchRequestsRef.current.set(entry.documentType, fetchController)

              await fetchSettingsRef.current(entry.documentType, token, fetchController.signal).finally(() => {
                if (fetchRequestsRef.current.get(entry.documentType) === fetchController) {
                  fetchRequestsRef.current.delete(entry.documentType)
                }
              })
            }
          }
        } catch (err) {
          if (abortController.signal.aborted) {
            throw new AbortError()
          }
          console.error('Settings poll error', err)
          // Back off before retrying
          if (isActive) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
          }
        }
      }
    }

    const handleBeforeUnload = () => {
      abortController.abort()
    }

    // Safari/iOS specific: https://bugs.webkit.org/show_bug.cgi?id=219102
    if (/iP(ad|hone|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
      window.addEventListener('unload', handleBeforeUnload)
    } else {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    void poll().catch((ex) => {
      if (ex instanceof AbortError) return
      console.error('Unable to poll settings events', ex)
    })

    return () => {
      isActive = false
      abortController.abort()

      if (/iP(ad|hone|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
        window.removeEventListener('unload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [data?.accessToken])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    getSettings,
    updateSettings,
    subscribe
  }), [getSettings, updateSettings, subscribe])

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
