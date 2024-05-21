import * as Y from 'yjs'
import { type Block, type GetDocumentResponse } from '@/protos/service.js'
import { toYMap } from '../lib/toYMap.js'
import { group, ungroup } from '../lib/group.js'
import { newsDocToSlate, slateToNewsDoc } from '../newsdoc/index.js'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import { type TBElement } from '@ttab/textbit'
import { type Document } from '@hocuspocus/server'
import createHash from '../../../../shared/createHash.js'

function yContentToNewsDoc(yContent: Y.XmlText): Block[] | undefined {
  const slateElement = yTextToSlateElement(yContent).children
  return slateToNewsDoc(slateElement as TBElement[])
}

function assertDescriptions(yMeta: Y.Map<unknown>, documentType: string): void {
  // Only perform on planning items and assignments
  if (!['core/planning-item', 'core/assignment'].includes(documentType)) {
    return
  }

  const yDesc = yMeta.get('core/description') as Y.Array<Y.Map<unknown>>

  const payload: Block = {
    id: '',
    uuid: '',
    uri: '',
    url: '',
    type: 'core/description',
    title: '',
    data: { text: '' },
    rel: '',
    role: '',
    name: '',
    value: '',
    contentType: '',
    links: [],
    content: [],
    meta: []
  }

  // No descriptions
  if (!yDesc) {
    const yArr = new Y.Array()
    yArr.push([toYMap({ ...payload, role: 'public' }, new Y.Map())])
    yArr.push([toYMap({ ...payload, role: 'internal' }, new Y.Map())])

    yMeta.set('core/description', yArr)
    return
  }

  // Already has two descriptions
  if (yDesc.length === 2) {
    return
  }

  // Find missing description
  const descriptionTypes = yDesc.map((yMap) => yMap.get('role') as string)
  const missingType = ['public', 'internal'].filter((role) => !descriptionTypes.includes(role))

  missingType.forEach((role) => {
    yDesc.push([toYMap({ ...payload, role }, new Y.Map())])
  })
}

export function newsDocToYDoc(yDoc: Document | Y.Doc, newsDoc: GetDocumentResponse): void {
  try {
    const yMap = yDoc.getMap('ele')
    const { document, version } = newsDoc

    if (document) {
      const { meta, links, content, ...rest } = document

      yMap.set('meta', toYMap(group(document.meta, 'type'), new Y.Map()))
      yMap.set('links', toYMap(group(document.links, 'type'), new Y.Map()))
      yMap.set('root', toYMap(rest, new Y.Map()))

      assertDescriptions(yMap.get('meta') as Y.Map<unknown>, document.type)

      // Assert assignment descriptions
      const yMeta = yMap.get('meta') as Y.Map<unknown>
      const yAssignments = yMeta.get('core/assignment') as Y.Array<unknown>
      if (yAssignments?.length) {
        for (const yAssignment of yAssignments) {
          const assMeta = (yAssignment as Y.Map<unknown>).get('meta') as Y.Map<unknown>
          assertDescriptions(assMeta, 'core/assignment')
        }
      }

      // Share editable content for Textbit use
      const yContent = new Y.XmlText()
      const slateDocument = newsDocToSlate(document?.content ?? [])
      yContent.applyDelta(
        slateNodesToInsertDelta(slateDocument)
      )
      yMap.set('content', yContent)

      // Set version
      const yVersion = yDoc.getMap('version')
      yVersion?.set('version', version?.toString())

      const originalHash = createHash(JSON.stringify(newsDoc.document))

      const yOriginalHash = yDoc.getMap('hash')
      yOriginalHash?.set('hash', originalHash)

      return
    }

    throw new Error('No document')
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}

export function yDocToNewsDoc(yDoc: Y.Doc): GetDocumentResponse {
  const yMap = yDoc.getMap('ele')
  try {
    const meta = ungroup((yMap.get('meta') as Y.Map<unknown>)?.toJSON() || {})
    const links = ungroup((yMap.get('links') as Y.Map<unknown>)?.toJSON() || {})

    const yContent = yMap.get('content') as Y.XmlText
    const content = yContent.toString() ? yContentToNewsDoc(yContent) : []


    const root = yMap.get('root') as Y.Map<unknown>

    const { uuid, type, uri, url, title, language } = root.toJSON()

    meta.forEach(docMeta => {
      if (docMeta.type === 'core/assignment') {
        docMeta.meta = docMeta.meta.filter(assMeta => {
          if (assMeta.type === 'core/description') {
            return assMeta.data.text !== ''
          }
          return true
        })
      }
    })

    return {
      version: BigInt(yDoc.getMap('version').get('version') as string),
      document: {
        uuid,
        type,
        uri,
        url,
        title,
        content: content || [],
        // Remove added empty descriptions
        meta: meta.filter((m) => {
          if (m.type === 'core/description') {
            return m.data.text !== ''
          }
          return true
        }),
        links,
        language
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}
