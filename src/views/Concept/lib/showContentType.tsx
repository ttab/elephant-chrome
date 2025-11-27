import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'
import { SectionContent } from '@/views/Concept/components/SectionContent'
import { StoryTagContent } from '@/views/Concept/components/StoryTagContent'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export const showContentType = ({ documentType, concept, provider, isActive, asDialog, handleChange, textPaths }:
{
  documentType: string | undefined
  concept: object
  provider: HocuspocusProvider
  isActive: boolean
  asDialog: boolean | undefined
  handleChange: (value: boolean) => void
  textPaths: { shortIndex: number, longIndex: number }
}) => {
  if (!concept || !provider) return <></>

  switch (documentType) {
    case 'core/section':
      return SectionContent({ isActive, handleChange, asDialog })
    case 'core/story':
      return StoryTagContent({ isActive, handleChange, textPaths, asDialog })
    case 'core/organiser':
      return OrganiserContent({ isActive, handleChange, asDialog, provider })
  }
}
