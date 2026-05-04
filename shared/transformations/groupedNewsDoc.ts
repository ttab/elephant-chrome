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
  const { document, version, isMetaDocument, mainDocument, subset } = structuredClone(payload)

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
    document: yDocument,
    subset
  }
}


/**
 *  Convert grouped YDocument format to the repository format NewsDoc
 */
export const fromGroupedNewsDoc = (payload: EleDocumentResponse): { document: Document } & Omit<GetDocumentResponse, 'document'> => {
  const { document, version, isMetaDocument, mainDocument, subset } = payload

  if (!document) {
    throw new Error('YDocumentResponse contains no document')
  }

  const newsDocument = {
    ...document,
    content: slateToNewsDoc(document.content) || [],
    meta: ungroup(document.meta),
    links: ungroup(document.links)
  }

  // Repo validator rejects empty tt/slugline and core/description blocks.
  // Strip them on the way out regardless of document type — articles created
  // from wires inherit an empty slugline from the selected planning, and the
  // article path bypassed cleanup before this guard was widened.
  stripEmptyValidatedMetaBlocks(newsDocument)

  return {
    version: BigInt(version),
    document: newsDocument,
    isMetaDocument,
    subset,
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

  objects.forEach((object) => {
    let key = object[groupKey] as string | undefined

    // Fallback to underscore if no groupKey is found
    if (!key) {
      key = '_'
    }

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

  Object.keys(obj).forEach((key) => {
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
 * Strip blocks the repo validator considers structurally invalid: tt/slugline
 * with empty value, core/description with empty text. The rule is "either
 * filled or absent" — the block must not exist with an empty value. Recurses
 * into core/assignment so nested assignment meta is cleaned the same way.
 */
function stripEmptyValidatedMetaBlocks(obj: Document | Block): void {
  obj.meta = obj.meta.filter((block) => {
    if (block.type === 'core/description' && !block.data?.text) {
      return false
    } else if (block.type === 'tt/slugline' && (typeof block.value !== 'string' || !block.value.trim())) {
      return false
    }

    return true
  })

  obj.meta.forEach((block) => {
    if (block.type === 'core/assignment') {
      stripEmptyValidatedMetaBlocks(block)
    }
  })
}


/**
 *  Assert that slugline and both internal and public descriptions exist on planning documents
 */
function assertPlanningHasNecessaryProperties(obj: Document | Block): void {
  const internalDesc = obj.meta.find((item) => item.type === 'core/description' && item.role === 'internal')
  const publicDesc = obj.meta.find((item) => item.type === 'core/description' && item.role === 'public')
  const slugline = obj.meta.find((item) => item.type === 'tt/slugline')

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

  obj.meta.forEach((block) => {
    if (block.type === 'core/assignment') {
      assertPlanningHasNecessaryProperties(block)
    }
  })
}
