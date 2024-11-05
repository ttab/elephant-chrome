import { type ViewProps } from '@/types'

export type ToQueryStringProps = Record<string, string> | Omit<ViewProps, 'id'> | undefined

function isScalar(value: unknown): boolean {
  return ['string', 'number', 'boolean'].includes(typeof value)
}

// We only want to include props that can be represented as a string in the query string
export function toQueryString(obj: ToQueryStringProps): string {
  if (!obj || Object.keys(obj).length === 0) {
    return ''
  }

  const scalarObj: Record<string, string> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key]
      if (isScalar(value)) {
        scalarObj[key] = String(value)
      }
    }
  }

  return `?${new URLSearchParams(scalarObj).toString()}`
}
