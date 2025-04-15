import { type View } from '@/types/index'
import type { Document } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/defaults/templates'

export function getTemplateFromView(type: View): (id: string, payload?: Templates.TemplatePayload) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning
    case 'Event':
      return Templates.event
    case 'Factbox':
      return Templates.factbox
    default:
      throw new Error(`No template for ${type}`)
  }
}
