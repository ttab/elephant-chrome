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
import { type Descendant, Text } from 'slate'
import { TextbitElement } from '@ttab/textbit'

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

  // Set version and original hash
  const yCtx = yDoc.getMap('ctx')
  yCtx.set('version', version)
  yCtx.set('hash', createHash(JSON.stringify(yMap.toJSON())))
}

/**
 * Convert a yjs structure to a grouped YDocumentResponse
 */
export function fromYjsNewsDoc(yDoc: Y.Doc): EleDocumentResponse {
  const yMap = yDoc.getMap('ele')

  const root = yMap.get('root') as Y.Map<unknown>
  const { uuid, type, uri, url, title, language } = root.toJSON() as Record<string, string>

  const meta = transformYXmlTextNodes(yMap.get('meta') as Y.Map<unknown>) as Record<string, EleBlock[]>

  const links = (yMap.get('links') as Y.Map<unknown>).toJSON() || {}

  const isTextDocument = ['core/article', 'core/editorial-info', 'core/flash'].includes(type)
  const yContent = yMap.get('content') as Y.XmlText
  const content = yContent.length
    ? removeConsecutiveEmptyTextNodes(yTextToSlateElement(yContent).children)
    : []

  const makeTitle = (): string => {
    if (isTextDocument) {
      const heading = (content as TBElement[])?.find((c: TBElement) => {
        if ('properties' in c) {
          return c?.properties?.role === 'heading-1'
        }
        return false
      })
      const child = heading?.children?.[0]
      if (child && 'text' in child) {
        const newHeading = child ? child?.text : undefined
        return newHeading || title
      }
    }
    return title
  }

  const _title = makeTitle()

  // From 20 nov 2025, using ctx for all extra document data
  let version = yDoc.getMap('ctx').get('version') as string
  if (!version) {
    // Backwards compatibility with older collaborative documents
    version = yDoc.getMap('version').get('version') as string
  }

  return {
    version,
    isMetaDocument: false,
    mainDocument: '',
    document: {
      uuid,
      type,
      uri,
      url,
      title: _title,
      content: content as TBElement[],
      meta,
      links,
      language
    }
  }
}


/**
 * Remove consecutive empty text elements.
 * Allows empty paragraphs, but not two empty paragraphs in a row.
 */
export function removeConsecutiveEmptyTextNodes(nodes: Descendant[]): Descendant[] {
  const result: Descendant[] = []
  let lastWasEmptyText = false

  for (const node of nodes) {
    if (
      TextbitElement.isText(node)
      && (!node.properties?.role || node.properties.role === '')
      && node.children.every((child) => {
        return Text.isText(child) && child.text === ''
      })
    ) {
      if (lastWasEmptyText) {
        continue
      }

      lastWasEmptyText = true
    } else {
      lastWasEmptyText = false
    }

    result.push(node)
  }

  return result
}
