import { Block } from '@/protos/service.js'
import { type YBlockGroup } from '@/shared/types/index.js'

/**
 * Group Blocks with same groupKey in arrays
 * @param Block[]
 * @param groupKey
 * @returns GroupedObjects
 */

export function group(objects: Block[], groupKey: keyof Block): YBlockGroup {
  const groupedObjects: YBlockGroup = {}

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

    // @ts-expect-error Can't get this ts error to go away
    groupedObjects[key].push(newObj)
  })

  return groupedObjects
}

/**
 * Reverts the operation of group function
* @param YBlockGroup
* @returns Block[]
 */
export function ungroup(obj: YBlockGroup): Block[] {
  const result: Block[] = []

  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        // Dont process __inProgress items
        if (!item.__inProgress) {
          const newObj = Block.create({
            ...item,
            meta: ungroup(item.meta as unknown as YBlockGroup || {}),
            links: ungroup(item.links as unknown as YBlockGroup || {}),
            content: ungroup(item.content as unknown as YBlockGroup || {})
          })

          result.push(newObj as unknown as Block)
        }
      })
    }
  })
  return result
}
