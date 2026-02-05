import type { Document } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/shared/templates'

export function getConceptTemplateFromDocumentType(documentType: string): (id: string, payload?: Templates.TemplatePayload) => Document {
  switch (documentType) {
    case 'core/section':
      return Templates.section
    case 'core/story':
      return Templates.story
    case 'core/organiser':
      return Templates.organiser
    default:
      throw new Error(`No template for ${documentType}`)
  }
}
