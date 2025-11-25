import { OrganiserContent } from '@/views/Concept/components/OrganiserContent'
import { SectionContent } from '@/views/Concept/components/SectionContent'
import { StoryTagContent } from '@/views/Concept/components/StoryTagContent'

export const conceptContentType = {
  'core/section': SectionContent,
  'core/story': StoryTagContent,
  'core/organiser': OrganiserContent
}
