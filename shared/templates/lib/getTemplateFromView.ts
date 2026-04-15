import { type View } from '@/types/index'
import type { Document } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/shared/templates'

export function getTemplateFromView(
  type: View,
  options?: { useHast?: boolean }
): (id: string, payload?: Templates.TemplatePayload, text?: string) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning
    case 'Event':
      return Templates.event
    case 'Factbox':
      return Templates.factbox
    case 'Flash':
      return options?.useHast ? Templates.hast : Templates.flash
    case 'QuickArticle':
      return Templates.quickArticle
    case 'TimelessArticle':
      return Templates.timeless
    default:
      throw new Error(`No template for ${type}`)
  }
}
