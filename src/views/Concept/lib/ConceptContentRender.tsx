import type { FormProps } from '@/components/Form/Root'
import type { YDocument } from '@/modules/yjs/hooks'
import { type ViewProps } from '@/types/index'
import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'
import { SectionContent } from '@/views/Concept/components/SectionContent'
import { StoryTagContent } from '@/views/Concept/components/StoryTagContent'
import { Error } from '@/views/Error'
import type * as Y from 'yjs'


export const ConceptContentRender = ({ ydoc, documentType, isActive, ...formProps}: ViewProps & {
  ydoc: YDocument<Y.Map<unknown>>
  documentType: string
  isActive: boolean | null
} & FormProps) => {
  // Error handling for missing document
  if (!formProps.id || typeof formProps.id !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  if (!documentType) return <></>
  switch (documentType) {
    case 'core/section':
      return <SectionContent {...formProps} ydoc={ydoc} isActive={isActive} />
    case 'core/story':
      return <StoryTagContent {...formProps} ydoc={ydoc} isActive={isActive} />
    case 'core/organiser':
      return <OrganiserContent {...formProps} ydoc={ydoc} isActive={isActive} />
    default:
      return <Error title='Innehållet hittades inte' message='Dokumenttypen finns inte' />
  }
}
