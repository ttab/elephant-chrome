import { useRegistry } from '@/hooks'

export const useIndexUrl = (): URL => {
  const { server: { indexUrl } } = useRegistry()

  if (!indexUrl) {
    throw new Error('No valid url to the index service available')
  }

  return indexUrl
}
