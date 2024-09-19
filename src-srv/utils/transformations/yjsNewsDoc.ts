import * as Y from 'yjs'
import { type Document } from '@hocuspocus/server'

import type {
  YDocumentResponse
} from '@/shared/types/index.js'
import { toYMap } from './lib/toYMap.js'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import createHash from '@/shared/createHash.js'


/**
 * Convert a grouped YDocumentResponse a yjs structure and add it to the provided Y.Doc
 */
export function toYjsNewsDoc(eleDoc: YDocumentResponse, yDoc: Document | Y.Doc): void {
  const yMap = yDoc.getMap('ele')
  const { document, version } = eleDoc

  if (!document) {
    throw new Error('YDocumentResponse contains no document')
  }

  const { meta, links, content, ...properties } = document
  yMap.set('meta', toYMap(meta))
  yMap.set('links', toYMap(links))
  yMap.set('root', toYMap(properties, new Y.Map()))

  // Slate text to yjs
  const yContent = new Y.XmlText()
  yContent.applyDelta(
    slateNodesToInsertDelta(content)
  )
  yMap.set('content', yContent)

  // Set version
  const yVersion = yDoc.getMap('version')
  yVersion?.set('version', version)

  // Set hash
  const originalHash = createHash(JSON.stringify(eleDoc.document))
  const yOriginalHash = yDoc.getMap('hash')
  yOriginalHash?.set('hash', originalHash)
}


/**
 * Converte a yjs structure to a grouped YDocumentResponse
 */
export async function fromYjsNewsDoc(yDoc: Y.Doc): Promise<YDocumentResponse> {
  const yMap = yDoc.getMap('ele')

  const root = yMap.get('root') as Y.Map<unknown>
  const { uuid, type, uri, url, title, language } = root.toJSON()

  const meta = (yMap.get('meta') as Y.Map<unknown>).toJSON() || {}
  const links = (yMap.get('links') as Y.Map<unknown>).toJSON() || {}

  const yContent = yMap.get('content') as Y.XmlText
  const content = yContent.toString() ? await yTextToSlateElement(yContent).children : []

  return {
    version: yDoc.getMap('version').get('version') as string,
    document: {
      uuid,
      type,
      uri,
      url,
      title,
      content,
      meta,
      links,
      language
    }
  }
}
