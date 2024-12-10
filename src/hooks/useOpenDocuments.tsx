import { useModal } from '@/components/Modal/useModal'
import { useNavigation } from '@/navigation/hooks/useNavigation'
import { useEffect, useState } from 'react'

type DocumentName = 'Planning' | 'Event' | 'Editor' | 'Factbox' | 'Flash' | 'Modal'
interface OpenDocument {
  id: string
  name: DocumentName
  active: boolean
}

/**
 * Provides information on open documents.
 * Ability to filter by name (type) or return ids only.
 */
export function useOpenDocuments(params: { name?: string, idOnly: true }): string[]
export function useOpenDocuments(params?: { name?: string, idOnly?: false }): OpenDocument[]
export function useOpenDocuments(params: { name?: string, idOnly?: boolean } = {}): OpenDocument[] | string[] {
  const { state } = useNavigation()
  const [documents, setDocuments] = useState<OpenDocument[]>([])
  const { idOnly, name } = params

  const { currentModal } = useModal()

  useEffect(() => {
    const names = ['Planning', 'Event', 'Editor', 'Factbox', 'Flash']
    const filteredDocuments = state.content.filter((s) => {
      return (!!s?.props?.id) && ((name && s.name === name) || names.includes(s.name))
    }).map((s) => {
      return {
        id: s?.props?.id || '',
        name: s.name as DocumentName,
        active: state.active === s.viewId
      }
    })

    if (currentModal) {
      setDocuments([...filteredDocuments, {
        ...currentModal,
        name: 'Modal',
        active: true
      }
      ])
    } else {
      setDocuments(filteredDocuments)
    }
  }, [name, state.content, state.active, currentModal])

  return idOnly ? documents.map((item) => item.id) : documents
}
