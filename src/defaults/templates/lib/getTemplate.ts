import { type View } from '@/types/index'
import type { Document } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/defaults/templates'

export function getTemplate(type: View): (id: string, payload?: Templates.TemplatePayload) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning
    case 'Event':
      return Templates.event
    default:
      throw new Error(`No template for ${type}`)
  }
}
