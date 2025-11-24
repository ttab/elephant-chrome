import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { useMemo, useState, useEffect } from 'react'
import type * as Y from 'yjs'

// Connection as stored in the Yjs Array
interface UserConnection {
  userId: string
  name: string
  email: string
  invisible: boolean
  instanceId: string
  socketId: string
  connectedAt: number
}

// User info aggregated from connections
export interface DocumentUser {
  id: string
  name: string
  email: string
  connectionCount: number
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
      rootMap: 'documents'
    }
  )

  const [updateCount, forceUpdate] = useState(0)
  const documentsMap = yDocument.ele as Y.Map<Y.Array<UserConnection>> | undefined

  // Subscribe to changes
  useEffect(() => {
    if (!documentsMap || typeof documentsMap.observeDeep !== 'function') {
      return
    }

    const onChange = () => forceUpdate((n) => n + 1)
    documentsMap.observeDeep(onChange)

    return () => documentsMap.unobserveDeep(onChange)
  }, [documentsMap, yDocument.synced])

  // Transform to array structure
  const documents = useMemo<TrackedDocument[]>(() => {
    if (!documentsMap) return []

    try {
      const rawData = documentsMap.toJSON() as Record<string, UserConnection[]>

      return Object.entries(rawData).map(([documentId, connections]) => ({
        id: documentId,
        count: connections.length,
        users: aggregateUsers(connections, includeInvisible)
      }))
    } catch {
      return []
    }
  }, [documentsMap, updateCount, includeInvisible])

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
 * Hook to get users on a specific document
 */
export function useTrackedUsers(documentId: string, includeInvisible = false): {
  users: DocumentUser[]
  count: number
  isConnected: boolean
  isSynced: boolean
} {
  const yDocument = useYDocument<Y.Map<Y.Array<UserConnection>>>(
    'tracked-documents',
    {
      rootMap: 'documents'
    }
  )

  // Subscribe to just this document's connections
  const [rawConnections] = useYValue<UserConnection[]>(
    yDocument.ele as Y.Map<unknown>,
    documentId
  )

  const users = useMemo(() => {
    return aggregateUsers(rawConnections, includeInvisible)
  }, [rawConnections, includeInvisible])

  const count = rawConnections?.length ?? 0

  return {
    users,
    count,
    isConnected: yDocument.connected,
    isSynced: yDocument.synced
  }
}

/**
 * Aggregate connections into unique users with counts
 */
function aggregateUsers(connections: UserConnection[] | undefined, includeInvisible: boolean): DocumentUser[] {
  if (!connections || connections.length === 0) return []

  const userMap = new Map<string, DocumentUser>()

  for (const conn of connections) {
    if (!userMap.has(conn.userId) && (includeInvisible || !conn.invisible)) {
      userMap.set(conn.userId, {
        id: conn.userId,
        name: conn.name,
        email: conn.email,
        connectionCount: 0
      })
    }
    userMap.get(conn.userId)!.connectionCount++
  }

  return Array.from(userMap.values())
}
