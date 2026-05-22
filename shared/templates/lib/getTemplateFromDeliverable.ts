import * as Templates from '@/shared/templates'
import type { TemplatePayload } from '@/shared/templates'
import type { DeliverableType } from './getDeliverableType'
import type { Document } from '@ttab/elephant-api/newsdoc'

export function getTemplateFromDeliverable(
  type: DeliverableType,
  options?: { hasVignette?: boolean }
): (id: string, payload: TemplatePayload) => Document {
  switch (type) {
    case 'article':
      return (id, payload) => Templates.article(id, payload, { hasVignette: options?.hasVignette })
    case 'flash':
      return Templates.flash
    case 'editorial-info':
      return Templates.editorialInfo
    case 'timeless':
      return (id, payload) => Templates.timeless(id, payload, { hasVignette: options?.hasVignette })
    default:
      return (id, payload) => Templates.article(id, payload, { hasVignette: options?.hasVignette })
  }
}
