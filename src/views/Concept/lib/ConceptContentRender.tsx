import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'
import { SectionContent } from '@/views/Concept/components/SectionContent'
import { StoryTagContent } from '@/views/Concept/components/StoryTagContent'
import { Error } from '@/views/Error'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export const ConceptContentRender = ({ documentType, concept, provider, isActive, asDialog, handleChange }:
{
  documentType: string | undefined
  concept: object
  provider: HocuspocusProvider
  isActive: boolean
  asDialog: boolean | undefined
  handleChange: (value: boolean) => void
}) => {
  if (!concept || !provider) return <></>
  switch (documentType) {
    case 'core/section':
      return SectionContent({ isActive, handleChange, asDialog })
    case 'core/story':
      return StoryTagContent({ isActive, handleChange, asDialog })
    case 'core/organiser':
      return OrganiserContent({ isActive, handleChange, asDialog, provider })
    default:
      return <Error title='Innehållet hittades inte' message='Dokumenttypen finns inte' />
  }
}
