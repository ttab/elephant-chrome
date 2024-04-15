import * as Y from 'yjs'
import { type Document } from '../../../protos/service.js'
import { toYMap } from '../lib/toYMap.js'
import { group, ungroup } from '../lib/group.js'

export function newsDocToYMap(document: Document, planningYMap: Y.Map<unknown>): Y.Map<unknown> {
  try {
    const { meta, links, ...rest } = document

    planningYMap.set('meta', toYMap(group(document.meta, 'type'), new Y.Map()))
    planningYMap.set('links', toYMap(group(document.links, 'type'), new Y.Map()))
    planningYMap.set('root', toYMap(rest, new Y.Map()))

    return planningYMap
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}

export function yMapToNewsDoc(planningYMap: Y.Map<unknown>): Document {
  try {
    const meta = ungroup((planningYMap.get('meta') as Y.Map<unknown>)?.toJSON() || {})
    const links = ungroup((planningYMap.get('links') as Y.Map<unknown>)?.toJSON() || {})
    const content = ungroup((planningYMap.get('content') as Y.Map<unknown>)?.toJSON() || {})
    const root = planningYMap.get('root') as Y.Map<unknown>

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

