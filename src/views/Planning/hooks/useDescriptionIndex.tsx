import { useYValue } from '@/modules/yjs/hooks'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'

type Role = 'internal' | 'public'

/**
 * Find the index of the description with the given role.
 *
 * Descriptions can be internal or public, they can be found in the array
 * array at the path meta.core/description.As the order of the internal and
 * public descriptions is not guaranteed we must be able to find which is
 * index has which role.
 *
 * ['meta', 'core/description', 0, 'data', 'text']
 * vs
 * ['meta', 'core/description', 1, 'data', 'text']
 */
export const useDescriptionIndex = (document: Y.Map<unknown> | undefined, role: Role) => {
  const [descriptions] = useYValue<Block[]>(document, ['meta', 'core/description'])
  return findDescriptionIndex(descriptions, role)
}

export function findDescriptionIndex(descriptions: Block[] | undefined, role: Role): number {
  if (!descriptions?.length) return role === 'public' ? 0 : 1

  const index = descriptions.findIndex((d) => d.role === role)
  return index !== -1 ? index : descriptions.length
}
