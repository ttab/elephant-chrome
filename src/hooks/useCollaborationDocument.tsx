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
  loading: boolean
  provider?: HocuspocusProvider
}

export const useCollaborationDocument = ({ documentId, initialDocument }: UseHocusPocusDocumentProps): UseHocusPocusDocumentResult => {
  const { data: sessionData, status } = useSession()
  const { server: { webSocketUrl } } = useRegistry()
  const [state, setState] = useState({
    synced: false,
    connected: false,
    document: initialDocument,
    provider: undefined as HocuspocusProvider | undefined,
    loading: true
  })

  // This hook is most often used to edit documents, that might be
  // open in another view, in a dialog.
  //
  // Use a new HP websocket for every document here so we can use
  // this extra editing without stopping yjs syncing to the already
  // open collaboration documents.
  //
  // Do not preserve the websocket when provider is closed.
  const webSocket = useMemo(() => {
    // If we don't have a documentId, we will never authenticate the webSocket.
    // And it will eventually error out with a 401.
    if (!documentId) {
      return
    }

    return (!webSocketUrl)
      ? undefined
      : new HocuspocusProviderWebsocket({
        url: webSocketUrl.toString()
      })
  }, [webSocketUrl, documentId])

  useEffect(() => {
    if (state.synced && !state.document) {
      setState((prevState) => ({ ...prevState, document: state.provider?.document, loading: false }))
    }
  }, [state.synced, state.document, state.provider?.document])

  useEffect(() => {
    if (!documentId || !webSocket || status !== 'authenticated') {
      setState({
        synced: false,
        connected: false,
        document: undefined,
        provider: undefined,
        loading: false
      })
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: webSocket,
      name: documentId,
      document: state.document,
      token: sessionData?.accessToken,
      preserveConnection: false,
      onConnect: () => {
        setState((prevState) => ({ ...prevState, connected: true }))
      },
      onSynced: () => {
        setState((prevState) => ({
          ...prevState,
          synced: true,
          document: provider.document,
          loading: false
        }))
      },
      onDisconnect: () => {
        setState((prevState) => ({ ...prevState, synced: false }))
        provider.destroy()
      },
      onClose: () => {
        setState((prevState) => ({ ...prevState, connected: false }))
        void provider.connect()
      }
    })

    setState((prevState) => ({ ...prevState, provider }))

    return () => {
      provider.destroy()
      webSocket.destroy()
      setState((prevState) => ({
        ...prevState,
        synced: false,
        connected: false,
        document: undefined,
        provider: undefined,
        loading: false
      }))
    }
  // We don't want to recreate the provider when accessToken is refreshed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, webSocket, status])

  return useMemo(() => ({
    document: state.document,
    documentId,
    connected: state.provider?.isConnected || state.connected,
    synced: state.synced,
    provider: state.provider,
    loading: !state.document
  }), [state.document, documentId, state.connected, state.synced, state.provider])
}
