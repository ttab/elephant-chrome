export function getDeliverableType(type: string | undefined): DeliverableType {
  switch (type) {
    case 'text':
      return 'article'
    case 'flash':
      return 'flash'
    case 'editorial-info':
      return 'editorial-info'
    case 'timeless':
      return 'timeless'
    default:
      return 'article'
  }
}

export type DeliverableType = 'article' | 'flash' | 'editorial-info' | 'timeless'
