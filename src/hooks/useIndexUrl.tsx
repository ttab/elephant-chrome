import { useRegistry } from '@/hooks'

export const useIndexUrl = (): URL => {
  const { server: { indexUrl } } = useRegistry()

  return indexUrl
}
