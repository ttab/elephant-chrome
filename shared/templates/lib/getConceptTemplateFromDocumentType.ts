import type { Document } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/shared/templates'

export function getConceptTemplateFromDocumentType(documentType: string | undefined): (id: string, payload?: Templates.TemplatePayload) => Document {
  console.log(documentType)
  switch (documentType) {
    case 'core/section':
      return Templates.section
    case 'core/story':
      return Templates.story
    default:
      throw new Error(`No template for ${documentType}`)
  }
}
