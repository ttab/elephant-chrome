import { useContext, useEffect, useState } from 'react'
import { DocTrackerContext } from '@/contexts/DocTrackerProvider'
import type * as Y from 'yjs'

interface ActiveUser {
  userId: string
  userName: string
  name: string
  count: number
  socketId: string
}

/**
 * Provides a list of collaborative users that have any of the provided documents open
 * as a Record keyed with the document id.
 */
export function useActiveUsers(documentIds: string[]): Record<string, ActiveUser[]> {
  const context = useContext(DocTrackerContext)
  const [openDocuments, setOpenDocuments] = useState<Y.Map<Y.Map<ActiveUser>> | undefined>()
  const [activeUsers, setActiveUsers] = useState<Record<string, ActiveUser[]>>({})

  // Initialize active users for provided document ids
  useEffect(() => {
    const { provider } = context
    const yMap = provider?.document.getMap('open-documents') as Y.Map<Y.Map<ActiveUser>>

    setOpenDocuments(yMap)
    setActiveUsers(
      getUsersforDocuments(yMap, documentIds)
    )
    // NOTE: Dependency array below should be left without the 'documentIds' dependency;
    // will cause render loop otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context])

  // Update users when user tracker document changes
  useEffect(() => {
    openDocuments?.observe((event) => {
      const yMap = event.currentTarget as Y.Map<Y.Map<ActiveUser>>

      setActiveUsers(
        getUsersforDocuments(yMap, documentIds)
      )
    })
  }, [openDocuments, documentIds])

  return activeUsers
}


/**
 * Retrieve active users in tracker ymap for provided document ids
 */
function getUsersforDocuments(yMap: Y.Map<Y.Map<ActiveUser>>, documentIds: string[]) {
  const users: Record<string, ActiveUser[]> = {}

  for (const id of documentIds) {
    const docUsers = yMap?.get(id)
    if (docUsers?.size) {
      users[id] = Object.values(docUsers.toJSON()) as ActiveUser[]
    }
  }

  return users
}
