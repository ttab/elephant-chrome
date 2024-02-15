import * as Y from 'yjs'
import { type Document } from '../../../protos/service.js'
import { toYMap } from '../lib/toYMap.js'
import { groupBy } from '../lib/groupBy.js'

export function newsDocToYPlanning(document: Document, planningYMap: Y.Map<unknown>): Y.Map<unknown> {
  try {
    const root = {
      title: document.title
    }
    const meta = toYMap(groupBy(document.meta, 'type'), new Y.Map())
    const links = toYMap(groupBy(document.links, 'type'), new Y.Map())

    planningYMap.set('meta', meta)
    planningYMap.set('links', links)
    planningYMap.set('root', toYMap(root, new Y.Map()))
    return planningYMap
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
    throw new Error('Unknown error')
  }
}

