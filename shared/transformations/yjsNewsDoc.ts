import * as Y from 'yjs'
import { type Document } from '@hocuspocus/server'

import type {
  EleBlock,
  EleDocumentResponse
} from '@/shared/types/index.js'
import { toYMap } from './toYMap.js'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core'
import createHash from '../createHash.js'
import { type TBElement } from '@ttab/textbit'
import { transformYXmlTextNodes } from './lib/transformYXmlTextNodes.js'

/**
 * Convert a grouped YDocumentResponse a yjs structure and add it to the provided Y.Doc
 */
export function toYjsNewsDoc(eleDoc: EleDocumentResponse, yDoc: Document | Y.Doc): void {
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

  // Create original hash based on eleDocument content and store in yjs structure
  const originalHash = createHash(JSON.stringify(eleDoc.document))
  const yOriginalHash = yDoc.getMap('hash')
  yOriginalHash?.set('hash', originalHash)
}


/**
 * Convert a yjs structure to a grouped YDocumentResponse
 */
export function fromYjsNewsDoc(yDoc: Y.Doc): {
  documentResponse: EleDocumentResponse
  updatedHash: number | undefined
  originalHash: number
} {
  const yMap = yDoc.getMap('ele')

  const root = yMap.get('root') as Y.Map<unknown>
  const { uuid, type, uri, url, title, language } = root.toJSON() as Record<string, string>

  const meta = transformYXmlTextNodes(yMap.get('meta') as Y.Map<unknown>) as Record<string, EleBlock[]>

  const links = (yMap.get('links') as Y.Map<unknown>).toJSON() || {}

  const yContent = yMap.get('content') as Y.XmlText
  const content = yContent.length ? yTextToSlateElement(yContent).children : []

  const responseDocument = {
    version: yDoc.getMap('version').get('version') as string,
    isMetaDocument: false,
    mainDocument: '',
    document: {
      uuid,
      type,
      uri,
      url,
      title,
      content: content as TBElement[],
      meta,
      links,
      language
    }
  }

  const currentHash = createHash(JSON.stringify(responseDocument.document))
  const originalHash = (yDoc.getMap('hash')?.get('hash') || 0) as number

  // Return response, original hash from yjs structure and newly calculated hash
  return {
    documentResponse: responseDocument,
    updatedHash: (currentHash !== originalHash) ? currentHash : undefined,
    originalHash
  }
}
