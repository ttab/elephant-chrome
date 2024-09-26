import { useNavigation } from '@/navigation/hooks/useNavigation'
import { type Document } from '@/protos/service'
import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Return a copy of the NewsDoc document of the currently active view if any.
 * Ability to filter by type.
 *
 * Useful when creating a new item and there is a need to suggest data from
 * the current active document.
 *
 * Returns undefined while loading, null if not found.
 */
export const useActiveDocument = ({ type }: {
  type?: 'Planning' | 'Event'
}): Document | null | undefined => {
  const { state } = useNavigation()
  const [document, setDocument] = useState<Document | null | undefined>(undefined)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const documentId = state.content.find(s => {
        return (type && s.props.name === type) && s.key === state.active
      })?.props.children.props.id

      if (!documentId) {
        setDocument(null)
        return
      }

      const response = await fetch(`${BASE_URL}/api/documents/${documentId}`)
      if (!response.ok) {
        setDocument(null)
        return
      }

      setDocument((await response.json() as Record<string, unknown>)?.document as Document || null)
    }

    void fetchData()
  }, [type, state.content, state.active])

  return document
}
