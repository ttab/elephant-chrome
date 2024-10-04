import { useState, useEffect, useContext } from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import * as Y from 'yjs'
import { HPWebSocketProviderContext } from '@/contexts'
import { createStateless, StatelessType } from '@/shared/stateless'

interface UseHocusPocusDocumentProps {
  documentId: string
  initialDocument?: Y.Doc
}

interface UseHocusPocusDocumentResult {
  document: Y.Doc | undefined
  connected: boolean
  synced: boolean
}

export const useCollaborationDocument = ({ documentId, initialDocument }: UseHocusPocusDocumentProps): UseHocusPocusDocumentResult => {
  const { webSocket } = useContext(HPWebSocketProviderContext)
  const { data: sessionData, status } = useSession()

  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [document, setDocument] = useState<Y.Doc | undefined>(initialDocument)
  const [provider, setProvider] = useState<HocuspocusProvider>()

  useEffect(() => {
    if (synced && !document) {
      setDocument(provider?.document)
    }
  }, [synced])

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
  }, [documentId, initialDocument, webSocket, sessionData?.accessToken, status])

  return {
    document,
    connected: !!provider?.isConnected || connected,
    synced
  }
}
