import { newsDocToYMap, yMapToNewsDoc } from '../src-srv/utils/transformations/yjs/yMap'
import * as Y from 'yjs'

import { planning } from './data/planning-newsdoc'
import { article } from './data/article-newsdoc'

/*
  * Array order is not guaranteed.
  * Sorts the JSON object recursively so that we can compare the objects
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortDocument(json: any): any {
  if (Array.isArray(json)) {
    return json.map(sortDocument)
      .sort((a: unknown, b: unknown) => {
        if (typeof a === 'object' && typeof b === 'object') {
          return JSON.stringify(a).localeCompare(JSON.stringify(b))
        }
        return JSON.stringify(a).localeCompare(JSON.stringify(b))
      })
  } else if (typeof json === 'object' && json !== null) {
    const sortedObject: Record<string, unknown> = {}
    Object.keys(json as Record<string, unknown>).sort().forEach(key => {
      sortedObject[key] = sortDocument((json)[key])
    })
    return sortedObject
  }
  return json
}

describe('Transform full planning newsdoc document to internal YMap representation', () => {
  const yDoc = new Y.Doc()
  newsDocToYMap(yDoc, planning)

  it('handles transoformation of planning document', () => {
    const planningJson = yDoc.getMap('ele').toJSON()
    expect(planningJson).toMatchSnapshot()
  })


  it('handles reverting the planning document', () => {
    const { document, version } = yMapToNewsDoc(yDoc)
    if (!document || !planning.document) {
      throw new Error('no document')
    }
    expect(version).toBe(planning.version)
    expect(sortDocument(document)).toEqual(sortDocument(planning.document))
  })
})

describe('Transform full article newsdoc document to internal YMap representation', () => {
  const yDoc = new Y.Doc()
  newsDocToYMap(yDoc, article)

  it('handles article document', () => {
    const articleJson = yDoc.getMap('ele').toJSON()
    expect(articleJson).toMatchSnapshot()
  })


  it('handles reverting the article document', () => {
    const { document, version } = yMapToNewsDoc(yDoc)

    if (!document || !article.document) {
      throw new Error('no document')
    }
    expect(version).toBe(article.version)
    expect(sortDocument(document)).toEqual(sortDocument(article.document))
  })
})
