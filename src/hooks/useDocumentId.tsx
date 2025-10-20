import { getValueFromPath } from '@/shared/yUtils'
import { useCollaboration } from './useCollaboration'

/**
 * @deprecated - use YDocument.id instead
 */
export const useDocumentId = (): string => {
  const { provider } = useCollaboration()
  const uuid = getValueFromPath(provider?.document.getMap('ele'), ['root', 'uuid'])

  return (typeof uuid === 'string') ? uuid : ''
}
