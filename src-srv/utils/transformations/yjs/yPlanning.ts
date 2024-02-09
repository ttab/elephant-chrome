import * as Y from 'yjs'
import { type Document, type Block } from '../../../protos/service.js'

export function newsDocToYPlanning(document: Document, planningYMap: Y.Map<unknown>): Y.Map<unknown> {
  try {
    const root = {
      title: document.title
    }
    const meta = toYMap(groupBy(document.meta, 'type'), new Y.Map())
    const links = toYMap(groupBy(document.links, 'type'), new Y.Map())

    planningYMap.set('meta', meta)
    planningYMap.set('links', links)
    planningYMap.set('root', toYMap(root, new Y.Map()))
    return planningYMap
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}

type GroupedObjects = Record<string, Block[]>
const groupBy = (objects: Block[], groupKey: keyof Block): GroupedObjects => {
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

// TODO: Almost identical to newsDocToYmap function, make reuseable?
export function toYMap<T extends Record<string, unknown>>(d: T, map: Y.Map<unknown> = new Y.Map()): Y.Map<unknown> {
  for (const key in d) {
    const value = d[key]
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        const nestedArray = new Y.Array()
        value.forEach((v: unknown) => nestedArray.push([toYMap(v as Record<string, unknown>, new Y.Map())]))
        map.set(key, nestedArray)
      } else {
        map.set(key, toYMap(value as Record<string, unknown>, new Y.Map()))
      }
    } else {
      map.set(key, value)
    }
  }
  return map
}
