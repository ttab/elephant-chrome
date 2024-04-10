import { type Block } from '../../../protos/service.js'

/**
 * Group Blocks with same groupKey in arrays
 * @param Block[]
 * @param groupKey
 * @returns GroupedObjects
 */

export type GroupedObjects = Record<string, Block[]>

export function group(objects: Block[], groupKey: keyof Block): GroupedObjects {
  const groupedObjects: GroupedObjects = {}

  objects.forEach(object => {
    if (!object[groupKey]) return

    if (!groupedObjects[(object[groupKey] as string)]) {
      groupedObjects[(object[groupKey]) as string] = []
    }

    // eslint-disable-next-line
    const newObj: any = { ...object }

    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key as keyof Block])) {
        const array = object[key as keyof Block]
        newObj[key] = group((array as Block[]), groupKey)
      }
    })

    groupedObjects[(object[groupKey]) as string].push(newObj as Block)
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
      obj[key].forEach((item: Block) => {
        const newObj: Block = {
          ...item,
          meta: ungroup(item.meta as unknown as GroupedObjects),
          links: ungroup(item.links as unknown as GroupedObjects),
          content: ungroup(item.content as unknown as GroupedObjects)
        }

        result.push(newObj as unknown as Block)
      })
    }
  })
  return result
}
