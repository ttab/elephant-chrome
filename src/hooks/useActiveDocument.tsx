import { get } from '@/lib/repository/get'
import { useNavigation } from '@/navigation/hooks/useNavigation'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { useEffect, useState } from 'react'

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
        return (type && s.props.name === type) && (s.key === state.active || state.content.length === 1)
      })?.props.children.props.id

      if (!documentId || typeof documentId !== 'string') {
        setDocument(null)
        return
      }

      setDocument(await get(documentId))
    }

    void fetchData()
  }, [type, state.content, state.active])

  return document
}
