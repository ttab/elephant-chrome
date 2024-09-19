import {
  Block,
  type Document,
  type GetDocumentResponse
} from '@/shared/protos/service.js'

import type {
  YDocumentResponse,
  YDocument,
  YBlockGroup
} from '@/shared/types/index.js'

import { newsDocToSlate, slateToNewsDoc } from './newsdoc/index.js'


/**
 *  Convert repository format NewsDoc to grouped YDocument format
 */
export const toGroupedNewsDoc = (payload: GetDocumentResponse): YDocumentResponse => {
  const { document, version } = payload

  if (!document) {
    throw new Error('GetDocumentResponse contains no document')
  }

  if (document.type === 'core/planning') {
    assertPlanningHasNecessaryProperties(document)
  }

  // const { meta, links, content, ...properties } = document
  const yDocument: YDocument = {
    ...document,
    content: newsDocToSlate(document.content),
    meta: group(document.meta || [], 'type'),
    links: group(document.links || [], 'type')
  }

  return {
    version: version.toString(),
    document: yDocument
  }
}


/**
 *  Convert grouped YDocument format to the repository format NewsDoc
 */
export const fromGroupedNewsDoc = async (payload: YDocumentResponse): Promise<GetDocumentResponse> => {
  const { document, version } = payload

  if (!document) {
    throw new Error('YDocumentResponse contains no document')
  }

  const newsDocument = {
    ...document,
    // FIXME: Why is this async, really? This forces this func to be async!
    content: await slateToNewsDoc(document.content) || [],
    meta: ungroup(document.meta),
    links: ungroup(document.links)
  }

  assertPlanningHasNoEmptyProperties(newsDocument)

  return {
    version: BigInt(version),
    document: newsDocument
  }
}


/**
 * Group Blocks with same group key in arrays
 *
 * @param Block[]
 * @param groupKey
 * @returns YBlockGroup
 */
function group(objects: Block[], groupKey: keyof Block): YBlockGroup {
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
 * Reverts the operation of the group function
 *
 * @param YBlockGroup
 * @returns Block[]
 */
function ungroup(obj: YBlockGroup): Block[] {
  const result: Block[] = []

  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        // Ignore __inProgress items
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

/**
 *  Assert that we don't leave empty sluglines or descriptions on planning documents
 */
function assertPlanningHasNoEmptyProperties(obj: Document | Block): void {
  obj.meta = obj.meta.filter(block => {
    if (block.type === 'core/description' && !block.data.text) {
      return false
    } else if (block.type === 'tt/slugline' && !block.value) {
      return false
    }

    return true
  })

  obj.meta.forEach(block => {
    if (block.type === 'core/assignment') {
      assertPlanningHasNoEmptyProperties(block)
    }
  })
}


/**
 *  Assert that slugline and both internal and public descriptions exist on planning documents
 */
function assertPlanningHasNecessaryProperties(obj: Document | Block): void {
  const internalDesc = obj.meta.find(item => item.type === 'core/description' && item.role === 'internal')
  const publicDesc = obj.meta.find(item => item.type === 'core/description' && item.role === 'public')
  const slugline = obj.meta.find(item => item.type === 'tt/slugline')

  if (!slugline) {
    obj.meta.push(Block.create({
      type: 'tt/slugline'
    }))
  }

  if (!internalDesc) {
    obj.meta.push(Block.create({
      type: 'core/description',
      data: { text: '' }
    }))
  }

  if (!publicDesc) {
    obj.meta.push(Block.create({
      type: 'core/description',
      data: { text: '' }
    }))
  }

  obj.meta.forEach(block => {
    if (block.type === 'core/assignment') {
      assertPlanningHasNecessaryProperties(block)
    }
  })
}
