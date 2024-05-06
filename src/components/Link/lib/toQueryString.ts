import { type ViewProps } from '@/types'


// FIX ME: ViewProps has transformed and is not longer only string or scalar values
// It contains functions that can not be serialized to a query string
export type ToQueryStringProps = Record<string, string> | Omit<ViewProps, 'id'> | undefined

export function toQueryString(obj: ToQueryStringProps): string {
  if (!obj || Object.keys(obj).length === 0) {
    return ''
  }

  return `?${new URLSearchParams(obj as Record<string, string>).toString()}`
}
