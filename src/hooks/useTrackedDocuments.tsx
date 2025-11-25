import { useYDocument } from '@/modules/yjs/hooks'
import { useMemo, useState, useEffect } from 'react'
import type * as Y from 'yjs'

// Connection as stored in the Yjs Array
interface UserConnection {
  sub: string
  name: string
  email: string
  visibility: Record<string, boolean>
  instanceId: string
  socketId: string
  connectedAt: number
}

// User info aggregated from connections
export interface DocumentUser {
  id: string
  name: string
  email: string
}

// Document with its users
export interface TrackedDocument {
  id: string
  count: number
  users: DocumentUser[]
}

// Return type of the hook
export interface OpenDocumentsState {
  documents: TrackedDocument[]
  isConnected: boolean
  isSynced: boolean
  getDocument: (documentId: string) => TrackedDocument | undefined
}

/**
 * Hook to access all open documents
 */
export function useTrackedDocuments(includeInvisible: boolean = false): OpenDocumentsState {
  const yDocument = useYDocument<Y.Map<Y.Array<UserConnection>>>(
    'tracked-documents',
    {
      // Set yDocument.ele to point at the root Y.Map "documents"
      // where we will find the open documents map instead of in ele.
      rootMap: 'documents'
    }
  )

  const [updateCount, forceUpdate] = useState(0)
  const documentsMap = yDocument.ele as Y.Map<Y.Array<UserConnection>> | undefined

  useEffect(() => {
    if (!documentsMap || typeof documentsMap.observeDeep !== 'function') {
      return
    }

    const onChange = () => {
      forceUpdate((n) => n + 1)
    }

    documentsMap.observeDeep(onChange)

    return () => documentsMap.unobserveDeep(onChange)
  }, [documentsMap])

  // Transform to array structure
  const documents = useMemo<TrackedDocument[]>(() => {
    if (!documentsMap || !yDocument.synced) {
      return []
    }

    try {
      const result: TrackedDocument[] = []

      // Iterate directly over the Y.Map
      documentsMap.forEach((connectionsArray, documentId) => {
        const connections = connectionsArray.toJSON() as UserConnection[]

        result.push({
          id: documentId,
          count: connections.length,
          users: aggregateUsers(connections, includeInvisible)
        })
      })

      return result
    } catch (_) {
      return []
    }
    // updateCount is used to force re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsMap, updateCount, includeInvisible, yDocument.synced])

  const getDocument = useMemo(() => {
    return (documentId: string) => documents.find((doc) => doc.id === documentId)
  }, [documents])

  return {
    documents,
    isConnected: yDocument.connected,
    isSynced: yDocument.synced,
    getDocument
  }
}

/**
 * Aggregate connections into unique users with counts
 */
function aggregateUsers(connections: UserConnection[] | undefined, includeInvisible: boolean): DocumentUser[] {
  if (!connections || connections.length === 0) return []

  const userMap = new Map<string, DocumentUser>()

  for (const conn of connections) {
    if (!userMap.has(conn.sub) && (includeInvisible || Object.values(conn.visibility).includes(true))) {
      userMap.set(conn.sub, {
        id: conn.sub,
        name: conn.name,
        email: conn.email
      })
    }
  }

  return Array.from(userMap.values())
}
