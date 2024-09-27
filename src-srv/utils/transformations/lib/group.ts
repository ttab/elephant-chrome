import { Block } from '@ttab/elephant-api/newsdoc'
import { type YBlock } from '@/shared/types/index.js'

/**
 * Group Blocks with same groupKey in arrays
 * @param Block[]
 * @param groupKey
 * @returns GroupedObjects
 */

type GroupedObjects = Record<string, YBlock[]>

export function group(objects: Block[], groupKey: keyof Block): GroupedObjects {
  const groupedObjects: GroupedObjects = {}

  objects.forEach(object => {
    const key = object[groupKey] as string | undefined
    if (!key) return

    if (!groupedObjects[key]) {
      groupedObjects[key] = []
    }

    const newObj = { ...object }

    Object.entries(newObj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // @ts-expect-error Can't get this ts error to go away
        newObj[key] = group(value, groupKey)
      }
    })

    groupedObjects[key].push(newObj)
  })

  return groupedObjects
}

/**
 * Reverts the operation of group function
* @param GroupedObjects
* @returns Block[]
 */
export function ungroup(obj: GroupedObjects): Block[] {
  const result: Block[] = []

  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        // Dont process __inProgress items
        if (!item.__inProgress) {
          const newObj = Block.create({
            ...item,
            meta: ungroup(item.meta as unknown as GroupedObjects || {}),
            links: ungroup(item.links as unknown as GroupedObjects || {}),
            content: ungroup(item.content as unknown as GroupedObjects || {})
          })

          result.push(newObj as unknown as Block)
        }
      })
    }
  })
  return result
}
