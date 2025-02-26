import { Document, type Document as DocumentType, Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/lib/yUtils'
import type { Doc } from 'yjs'
import type { EleBlockGroup, EleDocument } from '@/shared/types'

/**
 * Create a template structure for a event document
 *
 * @returns Document
 */
// FIXME: Get correct dateGranularity and datetime from Date Component
export function duplicateTemplate(id: string, document: Doc | undefined, payload: { newDate: string, type: string }/* , document: Doc, type: string, newDate: string */): DocumentType {
  function mergeDateWithTime(date1ISO: string, date2ISO: string) {
    if (!date1ISO || !date2ISO) {
      return ''
    }

    const [_, time] = date1ISO.split('T')
    const [date] = date2ISO.split('T')
    return `${date}T${time}`
  }

  const fields = ['root', 'meta', 'links', 'content']
  const doc: EleDocument = fields.reduce((_doc, field) => {
    const [value] = getValueByYPath<EleBlockGroup>(document?.getMap('ele'), field)

    if (!value) {
      return _doc
    }

    if (field === 'meta') {
      Object.keys(value).forEach((key: string) => {
        if (key === 'core/event') {
          value[key][0] = {
            ...value[key][0],
            data: {
              ...value[key][0]?.data,
              start: mergeDateWithTime(value[key][0]?.data?.start, payload?.newDate),
              end: mergeDateWithTime(value[key][0]?.data?.end, payload?.newDate)
            }
          }
        }
      })
    }

    const values = typeof value === 'object' && field === 'root' ? value : { [field]: value }
    return { ..._doc, ...values }
  }, {
    meta: {},
    links: {},
    language: '',
    content: [],
    uuid: '',
    type: '',
    uri: '',
    url: '',
    title: ''
  })

  console.log('nytt id från template:', id)
  console.log('doc meta', doc.meta)
  console.log('doc links', doc.links)

  return Document.create({
    uuid: id,
    type: payload?.type,
    uri: `core://${payload?.type}/${id}`,
    language: doc.language,
    // links: [doc.links],
    meta: [
      doc.meta,
      Block.create({
        type: 'core/copy-group',
        uuid: crypto.randomUUID()
      })
      // doc.meta?.['core/newsvalue'] && Block.create({
      //   type: 'core/newsvalue',
      //   value: doc.meta?.['core/newsvalue']?.[0]?.value
      // }),
      // doc.meta?.['core/description'] && Block.create({
      //   type: 'core/description',
      //   data: doc.meta?.['core/description']?.[0]?.data
      // }),
      // doc.meta?.['core/event'] && Block.create({
      //   type: 'core/event',
      //   data: doc.meta?.['core/event']?.[0]?.data
      // }),
    ]
  // links: [
  //   ...payload?.links?.['core/event'] || [],
  //   ...payload?.links?.['core/story'] || [],
  //   ...payload?.links?.['core/section'] || []
  // ]
  })
}
