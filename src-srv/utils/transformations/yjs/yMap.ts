import * as Y from 'yjs'
import { type Block, type GetDocumentResponse } from '../../../protos/service.js'
import { toYMap } from '../lib/toYMap.js'
import { group, ungroup } from '../lib/group.js'
import { newsDocToSlate, slateToNewsDoc } from '../newsdoc/index.js'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import { type TBElement } from '@ttab/textbit'
import { type Document } from '@hocuspocus/server'

function yContentToNewsDoc(yContent: Y.XmlText): Block[] | undefined {
  const slateElement = yTextToSlateElement(yContent).children
  return slateToNewsDoc(slateElement as TBElement[])
}

export function newsDocToYMap(yDoc: Document | Y.Doc, newsDoc: GetDocumentResponse): void {
  try {
    const yMap = yDoc.getMap('ele')
    const { document, version } = newsDoc

    if (document) {
      const { meta, links, content, ...rest } = document

      yMap.set('meta', toYMap(group(document.meta, 'type'), new Y.Map()))
      yMap.set('links', toYMap(group(document.links, 'type'), new Y.Map()))
      yMap.set('root', toYMap(rest, new Y.Map()))

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

    const { uuid, type, url, uri, title, language } = root.toJSON()

    return {
      version: BigInt(yDoc.getMap('version').get('version') as string),
      document: {
        uuid,
        type,
        url,
        uri,
        title,
        content: content || [],
        meta,
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
