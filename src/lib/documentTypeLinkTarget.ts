import type { View } from '../types'

export function documentTypeLinkTarget(documentType: string | undefined): {
  label: string
  to: View
} {
  switch (documentType) {
    case 'text':
    case 'core/article':
      return {
        label: 'artikel',
        to: 'Editor'
      }
    case 'flash':
    case 'core/flash':
      return {
        label: 'flash',
        to: 'Flash'
      }
    case 'editorial-info':
    case 'core/editorial-info':
      return {
        label: 'till red',
        to: 'Editor'
      }
    default:
      return {
        label: 'okänd',
        to: 'Editor'
      }
  }
}
