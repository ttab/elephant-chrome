import type { View } from '@/types'

export function resolveDeliverableNavigation(type?: string): {
  view: View
  label: string
} {
  if (type === 'core/flash') {
    return { view: 'Flash', label: 'Öppna flash' }
  }
  return { view: 'Editor', label: 'Öppna artikel' }
}
