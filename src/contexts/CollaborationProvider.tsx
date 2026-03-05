import {
  createContext,
  type PropsWithChildren,
  type JSX
} from 'react'
import { useSession } from 'next-auth/react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { useYDocument, type YAwarenessUser } from '@/modules/yjs/hooks'

export type AwarenessStates = Array<{
  clientId: number
  data: YAwarenessUser
  focus?: {
    key: string
    path?: string
    color: string
  }
}>

export interface CollaborationProviderState {
  provider?: HocuspocusProvider
  documentId?: string
  connected: boolean
  synced: boolean
  user: YAwarenessUser
}

const initialState: CollaborationProviderState = {
  provider: undefined,
  documentId: undefined,
  connected: false,
  synced: false,
  user: {
    name: '',
    initials: '',
    color: '',
    avatar: undefined
  }
}

// Create the context
export const CollaborationContext = createContext(initialState)

export const CollaborationProviderContext = ({ documentId, children }: PropsWithChildren & {
  documentId?: string
  document?: unknown // Kept for backward compatibility but not used
}): JSX.Element => {
  const { status } = useSession()

  if (status !== 'authenticated') {
    throw new Error('Collaboration is not allowed without a valid access_token')
  }

  const { connected, synced, provider, user } = useYDocument(documentId || '')

  const state: CollaborationProviderState = {
    provider: provider || undefined,
    documentId,
    connected,
    synced,
    user: user || initialState.user
  }

  // Don't render children until we have a provider
  if (!provider || !documentId) {
    return <></>
  }

  return (
    <CollaborationContext.Provider value={state}>
      {children}
    </CollaborationContext.Provider>
  )
}
