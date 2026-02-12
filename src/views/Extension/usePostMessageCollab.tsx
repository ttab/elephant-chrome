import { useCallback, useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { useClientRegistry } from '@/modules/yjs/hooks/useClientRegistry'
import type { CollaborationClient } from '@/modules/yjs/classes/CollaborationClient'
import type { YAwarenessObject, YAwarenessUser } from '@/modules/yjs/hooks/useYAwareness'

interface CollabSession {
  uuid: string
  client: CollaborationClient
  doc: Y.Doc
  cleanupDocUpdate: () => void
  cleanupAwareness: () => void
  cleanupStatus: () => void
}

interface CollabPayload {
  uuid?: string
  update?: number[]
}

export function usePostMessageCollab(
  postToIframe: (data: unknown) => void
): {
  handleCollabMessage: (type: string, payload: CollabPayload) => void
} {
  const clientRegistry = useClientRegistry()
  const sessionsRef = useRef<Map<string, CollabSession>>(new Map())

  const closeSession = useCallback((uuid: string) => {
    const session = sessionsRef.current.get(uuid)
    if (!session) return

    session.cleanupDocUpdate()
    session.cleanupAwareness()
    session.cleanupStatus()
    clientRegistry?.release(uuid)
    sessionsRef.current.delete(uuid)
  }, [clientRegistry])

  const handleCollabMessage = useCallback((type: string, payload: CollabPayload) => {
    if (!clientRegistry) {
      console.warn('Extension collab: client registry not available')
      return
    }

    const uuid = payload?.uuid
    if (!uuid) {
      console.warn('Extension collab: missing uuid in payload')
      return
    }

    switch (type) {
      case 'open_collab': {
        if (sessionsRef.current.has(uuid)) {
          console.warn('Extension collab: session already open for', uuid)
          return
        }

        // Provide a fresh doc for the case where no client exists yet.
        // If the registry already has a client (e.g. Editor has it open),
        // this doc is ignored and we use client.getDocument() instead.
        const fallbackDoc = new Y.Doc()

        clientRegistry.get(uuid, { document: fallbackDoc }).then((client) => {
          // Always use the client's actual doc — it may differ from fallbackDoc
          // when the registry reused an existing client.
          const doc = client.getDocument()

          // Track whether the sync callback fired synchronously
          let hasSynced = false

          const sendInitialState = () => {
            const update = Y.encodeStateAsUpdate(doc)
            postToIframe({
              type: 'collab_synced',
              payload: { uuid, update: Array.from(update) }
            })
          }

          // onStatusChange fires the listener immediately with current status.
          // If hpSynced is already true, the callback runs before the assignment
          // completes — so we use a flag and unsubscribe after.
          const cleanupStatus = client.onStatusChange((status) => {
            if (!status.hpSynced || hasSynced) return
            hasSynced = true
            sendInitialState()
          })

          // If it fired synchronously, unsubscribe now
          if (hasSynced) {
            cleanupStatus()
          }

          // Relay incremental updates from Y.Doc to iframe
          const onDocUpdate = (update: Uint8Array, origin: unknown) => {
            if (origin === 'extension') return

            postToIframe({
              type: 'collab_update',
              payload: { uuid, update: Array.from(update) }
            })
          }
          doc.on('update', onDocUpdate)
          const cleanupDocUpdate = () => doc.off('update', onDocUpdate)

          // Relay awareness changes to iframe (read-only)
          const provider = client.getProvider()
          let cleanupAwareness = () => {}

          if (provider?.awareness) {
            const awareness = provider.awareness
            const onAwarenessChange = () => {
              const localClientId = awareness.clientID
              const states = awareness.getStates()
              const remoteStates: YAwarenessObject[] = []

              states.forEach((state, clientId: number) => {
                if (clientId === localClientId || !state.data) return

                remoteStates.push({
                  clientId,
                  data: state.data as YAwarenessUser,
                  focus: state.focus as YAwarenessObject['focus']
                })
              })

              postToIframe({
                type: 'collab_awareness',
                payload: { uuid, states: remoteStates }
              })
            }

            awareness.on('change', onAwarenessChange)
            cleanupAwareness = () => awareness.off('change', onAwarenessChange)

            // Send initial awareness state
            onAwarenessChange()
          }

          sessionsRef.current.set(uuid, {
            uuid,
            client,
            doc,
            cleanupDocUpdate,
            cleanupAwareness,
            cleanupStatus
          })
        }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err)
          console.error('Extension collab: failed to create client for', uuid, err)
          postToIframe({
            type: 'collab_error',
            payload: { uuid, error: message }
          })
        })
        break
      }

      case 'collab_update': {
        const session = sessionsRef.current.get(uuid)
        if (!session) {
          console.warn('Extension collab: no session for update', uuid)
          return
        }

        if (!payload.update) return

        const update = new Uint8Array(payload.update)
        Y.applyUpdate(session.doc, update, 'extension')
        break
      }

      case 'close_collab': {
        closeSession(uuid)
        break
      }
    }
  }, [clientRegistry, postToIframe, closeSession])

  // Cleanup all sessions on unmount
  useEffect(() => {
    const sessions = sessionsRef.current
    return () => {
      for (const uuid of sessions.keys()) {
        closeSession(uuid)
      }
    }
  }, [closeSession])

  return { handleCollabMessage }
}
