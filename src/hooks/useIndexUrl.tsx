import { useRegistry } from '@/hooks'

export const useIndexUrl = (): URL => {
  return useRegistry().server.resolveServiceUrl('index')
}
