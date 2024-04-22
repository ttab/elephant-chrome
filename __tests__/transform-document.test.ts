import { newsDocToYDoc, yDocToNewsDoc } from '../src-srv/utils/transformations/yjs/yDoc'
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

describe('Transform full planning newsdoc document to internal YDoc representation', () => {
  const yDoc = new Y.Doc()
  newsDocToYDoc(yDoc, planning)

  it('handles transformation of planning document', () => {
    const planningJson = yDoc.getMap('ele').toJSON()
    expect(planningJson).toMatchSnapshot()
  })


  it('handles reverting the planning document', () => {
    const { document, version } = yDocToNewsDoc(yDoc)
    expect(version).toBe(planning.version)
    expect(sortDocument(document)).toEqual(sortDocument(planning.document))
  })
})

describe('Transform full article newsdoc document to internal YDoc representation', () => {
  const yDoc = new Y.Doc()
  newsDocToYDoc(yDoc, article)

  it('handles article document', () => {
    const articleJson = yDoc.getMap('ele').toJSON()
    expect(articleJson).toMatchSnapshot()
  })


  it('handles reverting the article document', () => {
    const { document, version } = yDocToNewsDoc(yDoc)

    if (!document || !article.document) {
      throw new Error('no document')
    }

    expect(version).toBe(article.version)
    expect(sortDocument(document)).toEqual(sortDocument(article.document))
  })
})

describe('Description handling - planning', () => {
  describe('When empty', () => {
    const yDoc = new Y.Doc()
    newsDocToYDoc(yDoc, planning)

    it('adds two descriptions (public and internal)', () => {
      const planningDescriptions = planning.document?.meta.filter((meta) => meta.type === 'core/description')
      expect(planningDescriptions?.length).toBe(0)

      const meta = yDoc.getMap('ele').get('meta') as Y.Map<unknown>
      const descriptions = meta.get('core/description') as Y.Array<Y.Map<unknown>>
      expect(descriptions.length).toBe(2)
      expect(descriptions.map((d) => d.get('role'))).toEqual(['public', 'internal'])
    })
    it('removes them when reverting', () => {
      const { document, version } = yDocToNewsDoc(yDoc)
      if (!document || !planning.document) {
        throw new Error('no document')
      }

      expect(version).toBe(planning.version)
      expect(document.meta.filter((meta) => meta.type === 'core/description').length).toBe(0)
      expect(sortDocument(document)).toEqual(sortDocument(planning.document))
    })
  })

  describe('When one exists', () => {
    const yDoc = new Y.Doc()
    const augmentedPlanning = {
      ...planning,
      document: {
        ...planning.document,
        meta: [
          ...(planning.document?.meta || []),
          {
            id: '',
            uuid: '',
            uri: '',
            url: '',
            type: 'core/description',
            title: '',
            data: { text: 'hojhoj' },
            rel: '',
            role: 'internal',
            name: '',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          }
        ]
      }
    }

    // @ts-expect-error unk
    newsDocToYDoc(yDoc, augmentedPlanning)

    it('adds one when one of other type exists', () => {
      const planningDescriptions = augmentedPlanning.document?.meta.filter((meta) => meta.type === 'core/description')
      expect(planningDescriptions?.length).toBe(1)

      const meta = yDoc.getMap('ele').get('meta') as Y.Map<unknown>
      const descriptions = meta.get('core/description') as Y.Array<Y.Map<unknown>>
      expect(descriptions.length).toBe(2)
      expect(descriptions.map((d) => d.get('role'))).toEqual(['internal', 'public'])
    })

    it('removes them when reverting', () => {
      const { document, version } = yDocToNewsDoc(yDoc)
      expect(version).toBe(planning.version)
      expect(document?.meta.filter((meta) => meta.type === 'core/description').length).toBe(1)
      expect(sortDocument(document)).toEqual(sortDocument(augmentedPlanning.document))
    })
  })
})
