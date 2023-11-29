import { type ViewProps } from '@/types'


type ToQueryStringProps = Record<string, string> | Omit<ViewProps, 'id'> | undefined

export function toQueryString(obj: ToQueryStringProps): string {
  if (!obj || Object.keys(obj).length === 0) {
    return ''
  }

  return `?${new URLSearchParams(obj as Record<string, string>).toString()}`
}
