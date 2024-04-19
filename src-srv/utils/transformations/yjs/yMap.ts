import * as Y from 'yjs'
import { type Document } from '../../../protos/service.js'
import { toYMap } from '../lib/toYMap.js'
import { group, ungroup } from '../lib/group.js'
import { newsDocToSlate, slateToNewsDoc } from '../newsdoc/index.js'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import { type TBElement } from '@ttab/textbit'

export function newsDocToYMap(document: Document, yMap: Y.Map<unknown>): Y.Map<unknown> {
  try {
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

    return yMap
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}

export function yMapToNewsDoc(yMap: Y.Map<unknown>): Document {
  try {
    const meta = ungroup((yMap.get('meta') as Y.Map<unknown>)?.toJSON() || {})
    const links = ungroup((yMap.get('links') as Y.Map<unknown>)?.toJSON() || {})
    const content = slateToNewsDoc(yMap.get('content') as TBElement[])
    const root = yMap.get('root') as Y.Map<unknown>

    const res = {
      ...root.toJSON(),
      content,
      meta,
      links
    } as unknown as Document

    return res
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}
