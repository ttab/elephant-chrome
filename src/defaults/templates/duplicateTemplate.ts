import {
  Document,
  Block,
  type Document as DocumentType,
  type Block as BlockType
} from '@ttab/elephant-api/newsdoc'
import { fromYjsNewsDoc } from '../../../src-srv/utils/transformations/yjsNewsDoc'
import type { Doc } from 'yjs'
import type { EleDocument } from '@/shared/types'

/**
 * Duplicate a document, by taking the original document as a parameter,
 * alter values expected to be changed, apply them and return the rest of the document.
 *
 * @returns Document
 */

export function duplicateTemplate(id: string, payload: { type: string, newDate: string, document: Doc }): DocumentType {
  const { documentResponse: { document: newsDocDocument } } = fromYjsNewsDoc(payload?.document)

  function mergeDateWithTime(date1ISO: string, date2ISO: string) {
    if (!date1ISO || !date2ISO) {
      return ''
    }

    const [_, time] = date1ISO.split('T')
    const [date] = date2ISO.split('T')
    return `${date}T${time}`
  }

  function filterNonEmpty(obj: BlockType): Record<string, string | object> {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const filteredObj: Record<string, string | object> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        const filteredValue: Block | object = filterNonEmpty(value as BlockType)
        if (Object.keys(filteredValue).length > 0) {
          filteredObj[key] = filteredValue
        }
      } else if (value !== '') {
        filteredObj[key] = value
      }
    }

    return filteredObj
  }

  const keys: Array<keyof EleDocument> = ['meta', 'links']

  const doc: DocumentType = keys.reduce((newDoc, key) => {
    if (!document || !newsDocDocument || !newsDocDocument[key]) {
      return newDoc
    }

    const value: Record<string, BlockType[]> = newsDocDocument[key]
    console.log('value', value)

    const blocks = Object.keys(value).reduce((acc, subkey: string) => {
      (acc)[subkey] = (() => {
        // Event documents: all we do is copying the date from the core/event,
        // the rest should be left as is.
        if (subkey === 'core/event') {
          const dateData = value?.[subkey]?.[0]?.data
          return Block.create({
            type: subkey,
            data: {
              ...dateData,
              start: mergeDateWithTime(dateData?.start, payload?.newDate),
              end: mergeDateWithTime(dateData?.end, payload?.newDate)
            }
          })
        }
        return Block.create({ ...filterNonEmpty(value[subkey][0]) })
      })()

      return acc
    }, {} as Record<string, Block>)

    return {
      ...newDoc,
      [key]: typeof newDoc[key] === 'object' ? { ...newDoc[key], ...blocks } : { ...blocks }
    }
  }, {} as DocumentType)

  return Document.create({
    ...newsDocDocument,
    uuid: id,
    type: `core/${payload?.type}`,
    uri: `core://${payload?.type}/${id}`,
    meta: [
      ...Object.values(doc?.meta ?? {}).flat(),
      Block.create({
        type: 'core/copy-group',
        uuid: crypto.randomUUID()
      })
    ],
    links: [
      ...Object.values(doc?.links ?? {}).flat()
    ]
  })
}
