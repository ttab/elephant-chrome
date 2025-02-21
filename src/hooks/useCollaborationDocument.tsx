import { useState, useEffect, useMemo } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import type * as Y from 'yjs'
import { useRegistry } from './useRegistry'

interface UseHocusPocusDocumentProps {
  documentId: string
  initialDocument?: Y.Doc
}

interface UseHocusPocusDocumentResult {
  document: Y.Doc | undefined
  documentId: string
  connected: boolean
  synced: boolean
}

export const useCollaborationDocument = ({ documentId, initialDocument }: UseHocusPocusDocumentProps): UseHocusPocusDocumentResult => {
  const { data: sessionData, status } = useSession()
  const { server: { webSocketUrl } } = useRegistry()
  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [document, setDocument] = useState<Y.Doc | undefined>(initialDocument)
  const [provider, setProvider] = useState<HocuspocusProvider>()

  // This hook is most often used to edit documents, that might be
  // open in another view, in a dialog.
  //
  // Use a new HP websocket for every document here so we can use
  // this extra editing without stopping yjs syncing to the already
  // open collaboration documents.
  const webSocket = useMemo(() => {
    return (!webSocketUrl) ? undefined : new HocuspocusProviderWebsocket({ url: webSocketUrl.toString() })
  }, [webSocketUrl])

  useEffect(() => {
    if (synced && !document) {
      setDocument(provider?.document)
    }
  }, [synced, document, provider?.document])

  useEffect(() => {
    if (!documentId || !webSocket || status !== 'authenticated') {
      setDocument(undefined)
      setSynced(false)
      setConnected(false)
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: webSocket,
      name: documentId,
      document,
      token: sessionData?.accessToken,

      onConnect: () => {
        setConnected(true)
      },
      onSynced: () => {
        setSynced(true)
        setDocument(provider.document)
      },
      onDisconnect: () => {
        setSynced(false)
      },
      onClose: () => {
        setConnected(false)
      }
    })

    setProvider(provider)

    return () => {
      provider.destroy()
      setProvider(undefined)
    }
  }, [documentId, document, initialDocument, webSocket, sessionData?.accessToken, status])

  return {
    document,
    documentId: documentId,
    connected: !!provider?.isConnected || connected,
    synced
  }
}
