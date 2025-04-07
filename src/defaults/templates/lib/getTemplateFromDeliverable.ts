import * as Templates from '@/defaults/templates'
import type { TemplatePayload } from '@/defaults/templates'
import type { DeliverableType } from './getDeliverableType'
import type { Document } from '@ttab/elephant-api/newsdoc'

export function getTemplateFromDeliverable(type: DeliverableType): (id: string, payload: TemplatePayload) => Document {
  switch (type) {
    case 'article':
      return Templates.article
    case 'flash':
      return Templates.flash
    case 'editorial-info':
      return Templates.editorialInfo
    default:
      return Templates.article
  }
}
