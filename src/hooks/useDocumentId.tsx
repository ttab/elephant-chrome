import { getValueByYPath } from '@/lib/yUtils'
import { useCollaboration } from './useCollaboration'

export const useDocumentId = (): string => {
  const { provider } = useCollaboration()
  const [uuid] = getValueByYPath(provider?.document.getMap('ele'), 'root.uuid')

  return (typeof uuid === 'string') ? uuid : ''
}
