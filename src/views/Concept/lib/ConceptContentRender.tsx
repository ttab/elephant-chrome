import type { YDocument } from '@/modules/yjs/hooks'
import { type ViewProps } from '@/types/index'
import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'
import { SectionContent } from '@/views/Concept/components/SectionContent'
import { StoryTagContent } from '@/views/Concept/components/StoryTagContent'
import { type ConceptTableDataMap } from '@/views/Concepts/lib/conceptDataTable'
import { Error } from '@/views/Error'
import type * as Y from 'yjs'


export const ConceptContentRender = ({ ydoc, concept, documentType, isActive, ...props }: ViewProps & {
  ydoc: YDocument<Y.Map<unknown>>
  concept: ConceptTableDataMap[keyof ConceptTableDataMap] | null
  documentType: string
  isActive: boolean | null
}) => {
  // Error handling for missing document
  if (!props.id || typeof props.id !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  if (!concept) return <></>
  switch (documentType) {
    case 'core/section':
      return SectionContent({ ydoc: ydoc, isActive: isActive, asDialog: props.asDialog })
    case 'core/story':
      return StoryTagContent({ ydoc: ydoc, isActive: isActive, asDialog: props.asDialog })
    case 'core/organiser':
      return OrganiserContent({ ydoc: ydoc, isActive: isActive, asDialog: props.asDialog, provider: ydoc.provider })
    default:
      return <Error title='Innehållet hittades inte' message='Dokumenttypen finns inte' />
  }
}
