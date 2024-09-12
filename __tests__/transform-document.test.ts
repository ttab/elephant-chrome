import { newsDocToYDoc, yDocToNewsDoc } from '../src-srv/utils/transformations/yjs/yDoc'
import * as Y from 'yjs'

import { planning } from './data/planning-newsdoc'
import { article } from './data/article-newsdoc'
import { Block, type GetDocumentResponse } from '@/protos/service'

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


  it('handles reverting the planning document', async () => {
    const { document, version } = await yDocToNewsDoc(yDoc)

    if (!document || !planning.document) {
      throw new Error('no document')
    }

    const augmentedPlanning: GetDocumentResponse = {
      ...planning,
      document: {
        ...planning.document,
        meta: [
          ...(planning.document?.meta || []),
          Block.create({
            type: 'tt/slugline'
          })
        ]
      }
    }

    expect(version).toBe(planning.version)
    expect(sortDocument(document)).toEqual(sortDocument(augmentedPlanning.document))
  })
})

describe('Transform full article newsdoc document to internal YDoc representation', () => {
  const yDoc = new Y.Doc()
  newsDocToYDoc(yDoc, article)

  it('handles article document', () => {
    const articleJson = yDoc.getMap('ele').toJSON()
    expect(articleJson).toMatchSnapshot()
  })


  it('handles reverting the article document', async () => {
    const { document, version } = await yDocToNewsDoc(yDoc)

    if (!document || !article.document) {
      throw new Error('no document')
    }

    expect(version).toBe(article.version)
    expect(sortDocument(document)).toEqual(sortDocument(article.document))
  })
})

describe('Description and slugline handling - planning', () => {
  describe('slugline', () => {
    const yDoc = new Y.Doc()
    newsDocToYDoc(yDoc, planning)

    it('adds slugline to planning and assignment', async () => {
      const sluglineBefore = planning.document?.meta.find((meta) => meta.type === 'tt/slugline')
      expect(sluglineBefore).toBeUndefined()

      const ele = yDoc.getMap('ele')
      const meta = ele.get('meta') as Y.Map<unknown>

      const createdSlugline = (meta.get('tt/slugline') as Y.Map<unknown>).toJSON() as Block[]

      // A slugline is created on the planning document with newsDocToYDoc
      expect(createdSlugline).toEqual([Block.create({ type: 'tt/slugline' })])
      expect(createdSlugline).toHaveLength(1)
      expect(createdSlugline[0].value).toBe('')

      const assignments = (meta.get('core/assignment') as Y.Map<unknown>).toJSON()
      // One slugline each
      expect(assignments[0].meta['tt/slugline']).toHaveLength(1)
      expect(assignments[1].meta['tt/slugline']).toHaveLength(1)

      // First assignment, existing slugline, existing value
      expect(assignments[0].meta['tt/slugline'][0].value).toBe('lands-tomasson')

      // Second assignment, created, empty string
      expect(assignments[1].meta['tt/slugline'][0].value).toBe('')
    })

    it('removes empty sluglines from assignments when reverting', async () => {
      // Revert to newsDoc
      const { document } = await yDocToNewsDoc(yDoc)

      // Created slugline on planning is kept
      const planningSlugline = document?.meta.filter((meta) => meta.type === 'tt/slugline')
      expect(planningSlugline).toHaveLength(1)
      expect(planningSlugline?.[0].value).toBe('')

      const revertedAssignments = document?.meta.filter((meta) => meta.type === 'core/assignment')

      // First assignment slugline is kept
      const firstRevertedAssignment = revertedAssignments?.[0].meta.filter(meta => meta.type === 'tt/slugline')
      expect(firstRevertedAssignment).toHaveLength(1)
      expect(firstRevertedAssignment?.[0].value).toBe('lands-tomasson')

      // Second assignment slugline is removed
      const secondRevertedAssignment = revertedAssignments?.[1].meta.filter(meta => meta.type === 'tt/slugline')
      expect(secondRevertedAssignment).toHaveLength(0)
    })
  })

  describe('Descriptions when empty', () => {
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

    it('removes descriptions when reverting', async () => {
      const { document, version } = await yDocToNewsDoc(yDoc)
      if (!document || !planning.document) {
        throw new Error('no document')
      }

      const augmentedPlanning: GetDocumentResponse = {
        ...planning,
        document: {
          ...planning.document,
          meta: [
            ...(planning.document?.meta || []),
            Block.create({
              type: 'tt/slugline'
            })
          ]
        }
      }


      expect(version).toBe(planning.version)
      expect(document.meta.filter((meta) => meta.type === 'core/description').length).toBe(0)
      expect(sortDocument(document)).toEqual(sortDocument(augmentedPlanning.document))
    })
  })

  describe('Description one exists', () => {
    const yDoc = new Y.Doc()
    if (!planning?.document) {
      throw new Error('no document')
    }

    const augmentedPlanning: GetDocumentResponse = {
      ...planning,
      document: {
        ...planning.document,
        meta: [
          ...(planning.document?.meta || []),
          Block.create({
            type: 'core/description',
            data: { text: 'hojhoj' },
            role: 'internal'
          }),
          Block.create({
            type: 'tt/slugline'
          })
        ]
      }
    }

    newsDocToYDoc(yDoc, augmentedPlanning)

    it('adds one when one of other type exists', () => {
      const planningDescriptions = augmentedPlanning.document?.meta.filter((meta) => meta.type === 'core/description')
      expect(planningDescriptions?.length).toBe(1)

      const meta = yDoc.getMap('ele').get('meta') as Y.Map<unknown>
      const descriptions = meta.get('core/description') as Y.Array<Y.Map<unknown>>
      expect(descriptions.length).toBe(2)
      expect(descriptions.map((d) => d.get('role'))).toEqual(['internal', 'public'])
    })

    it('removes them when reverting', async () => {
      const { document, version } = await yDocToNewsDoc(yDoc)
      expect(version).toBe(planning.version)
      expect(document?.meta.filter((meta) => meta.type === 'core/description').length).toBe(1)
      expect(sortDocument(document)).toEqual(sortDocument(augmentedPlanning.document))
    })
  })
})
