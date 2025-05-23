import { useEffect, useRef, useState } from 'react'
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
  loading: boolean
  provider?: HocuspocusProvider
}

export const useCollaborationDocument = ({
  documentId,
  initialDocument
}: UseHocusPocusDocumentProps): UseHocusPocusDocumentResult => {
  const { data: sessionData, status } = useSession()
  const { server: { webSocketUrl } } = useRegistry()

  const providerRef = useRef<HocuspocusProvider>()
  const [document, setDocument] = useState<Y.Doc | undefined>(initialDocument)
  const [connected, setConnected] = useState(false)
  const [synced, setSynced] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId || !webSocketUrl || status !== 'authenticated') return

    const websocket = new HocuspocusProviderWebsocket({
      url: webSocketUrl.toString()
    })

    const provider = new HocuspocusProvider({
      websocketProvider: websocket,
      name: documentId,
      document: initialDocument,
      token: sessionData?.accessToken,
      preserveConnection: false,
      onConnect: () => setConnected(true),
      onSynced: () => {
        setDocument(provider.document)
        setSynced(true)
        setLoading(false)
      },
      onDisconnect: () => {
        setSynced(false)
        setConnected(false)
      },
      onClose: () => setConnected(false)
    })

    providerRef.current = provider

    return () => {
      provider.destroy()
      websocket.destroy()
      setConnected(false)
      setSynced(false)
      setLoading(false)
      setDocument(undefined)
      providerRef.current = undefined
    }
  }, [documentId, webSocketUrl, initialDocument, sessionData?.accessToken, status])

  return {
    document,
    documentId,
    connected,
    synced,
    loading,
    provider: providerRef.current
  }
}
