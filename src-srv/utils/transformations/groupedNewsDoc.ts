import { type GetDocumentResponse } from '@ttab/elephant-api/repository'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'

import type {
  EleDocumentResponse,
  EleDocument,
  EleBlockGroup
} from '@/shared/types/index.js'

import { newsDocToSlate, slateToNewsDoc } from './newsdoc/index.js'


/**
 *  Convert repository format NewsDoc to grouped YDocument format
 */
export const toGroupedNewsDoc = (payload: GetDocumentResponse): EleDocumentResponse => {
  // Create clone of document so not to change original document/cause sideffects
  const { document, version, isMetaDocument, mainDocument } = structuredClone(payload)

  if (!document) {
    throw new Error('GetDocumentResponse contains no document')
  }

  if (document.type === 'core/planning-item') {
    assertPlanningHasNecessaryProperties(document)
  }

  const yDocument: EleDocument = {
    ...document,
    content: newsDocToSlate(document.content),
    meta: group(document.meta || [], 'type'),
    links: group(document.links || [], 'type')
  }

  return {
    version: version.toString(),
    isMetaDocument,
    mainDocument,
    document: yDocument
  }
}


/**
 *  Convert grouped YDocument format to the repository format NewsDoc
 */
export const fromGroupedNewsDoc = async (payload: EleDocumentResponse): Promise<{ document: Document } & Omit<GetDocumentResponse, 'document'>> => {
  const { document, version, isMetaDocument, mainDocument } = payload

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

  if (document.type === 'core/planning-item') {
    assertPlanningHasNoEmptyProperties(newsDocument)
  }

  return {
    version: BigInt(version),
    document: newsDocument,
    isMetaDocument,
    mainDocument
  }
}


/**
 * Group Blocks with same group key in arrays
 *
 * @param Block[]
 * @param groupKey
 * @returns YBlockGroup
 */
export function group(objects: Block[], groupKey: keyof Block): EleBlockGroup {
  const groupedObjects: EleBlockGroup = {}

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
export function ungroup(obj: EleBlockGroup): Block[] {
  const result: Block[] = []

  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        // Ignore __inProgress items
        if (!item.__inProgress) {
          const newObj = Block.create({
            ...item,
            meta: ungroup(item.meta as unknown as EleBlockGroup || {}),
            links: ungroup(item.links as unknown as EleBlockGroup || {}),
            content: ungroup(item.content as unknown as EleBlockGroup || {})
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
      role: 'internal',
      data: { text: '' }
    }))
  }

  if (!publicDesc) {
    obj.meta.push(Block.create({
      type: 'core/description',
      role: 'public',
      data: { text: '' }
    }))
  }

  obj.meta.forEach(block => {
    if (block.type === 'core/assignment') {
      assertPlanningHasNecessaryProperties(block)
    }
  })
}
