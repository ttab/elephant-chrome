import { type Block } from '../../../protos/service.js'
/**
 * Group Blocks with same groupKey in arrays
 * @param Block[]
 * @param groupKey
 * @returns GroupedObjects
 */
type GroupedObjects = Record<string, Block[]>
export function groupBy(objects: Block[], groupKey: keyof Block): GroupedObjects {
  const groupedObjects: GroupedObjects = {}

  objects.forEach(object => {
    const { [groupKey as keyof Block]: arrayToGroup, ...rest } = object
    if (!arrayToGroup) return

    if (!groupedObjects[(object[groupKey] as string)]) {
      groupedObjects[(object[groupKey]) as string] = []
    }

    // eslint-disable-next-line
    const newObj: any = { ...rest }

    Object.keys(object).forEach((key) => {
      if (Array.isArray(object[key as keyof Block])) {
        const array = object[key as keyof Block]
        newObj[key] = groupBy((array as Block[]), groupKey)
      }
    })

    groupedObjects[(object[groupKey]) as string].push(newObj as Block)
  })

  return groupedObjects
}
