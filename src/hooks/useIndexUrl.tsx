import { useRegistry } from '@/hooks'

export const useIndexUrl = (): URL | undefined => {
  const { server: { indexUrl } } = useRegistry()

  return indexUrl
}
