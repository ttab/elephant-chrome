/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { toGroupedNewsDoc, fromGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { toYjsNewsDoc, fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'

import * as Y from 'yjs'

import { planning } from './data/planning-newsdoc'
import { articleFactbox } from './data/article-factbox-newsdoc'
import { article } from './data/article-newsdoc'
import { type GetDocumentResponse } from '@ttab/elephant-api/repository'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { YBlock } from '@/shared/YBlock'

/*
 * Array order is not guaranteed.
 * Sorts the JSON object recursively so that we can compare the objects
 */
function sortDocument(json: unknown): unknown {
  if (Array.isArray(json)) {
    return json.map(sortDocument)
      .sort((a, b) => {
        if (typeof a === 'object' && typeof b === 'object') {
          return JSON.stringify(sortDocument(a)).localeCompare(JSON.stringify(sortDocument(b)))
        }
        return JSON.stringify(a).localeCompare(JSON.stringify(b))
      })
  } else if (typeof json === 'object' && json !== null) {
    const sortedObject: Record<string, unknown> = {}
    Object.keys(json).sort().forEach((key) => {
      sortedObject[key] = sortDocument((json as Record<string, unknown>)[key])
    })
    return sortedObject
  }
  return json
}


describe('Transform planning GetDocumentResponse', () => {
  const groupedPlanning = toGroupedNewsDoc(planning)
  const sortedDocument = sortDocument(planning.document)

  it('handles transformation to grouped format', () => {
    const planningJson = JSON.stringify(groupedPlanning)
    expect(planningJson).toMatchSnapshot()
  })

  it('handles transformation to Y.Doc', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(groupedPlanning, yDoc)

    const planningJson = yDoc.getMap('ele').toJSON()
    expect(planningJson).toMatchSnapshot()
  })

  it('does not alter document when converted to grouped format and back', () => {
    const ungroupedPlanning = fromGroupedNewsDoc(groupedPlanning)

    expect(ungroupedPlanning.version).toBe(planning.version)
    expect(sortDocument(ungroupedPlanning.document)).toEqual(sortedDocument)
  })

  it('does not alter document when converted to Y.Doc and back', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(groupedPlanning, yDoc)

    const { documentResponse } = fromYjsNewsDoc(yDoc)
    const ungroupedPlanning = fromGroupedNewsDoc(documentResponse)

    expect(ungroupedPlanning.version).toBe(planning.version)
    expect(sortDocument(ungroupedPlanning.document)).toEqual(sortedDocument)
  })
})


describe('Transform article GetDocumentResponse', () => {
  const groupedArticle = toGroupedNewsDoc(article)

  it('handles transformation to grouped format', () => {
    const articleJson = JSON.stringify(groupedArticle)
    expect(articleJson).toMatchSnapshot()
  })

  it('handles transformation to Y.Doc', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(groupedArticle, yDoc)

    const articleJson = yDoc.getMap('ele').toJSON()
    expect(articleJson).toMatchSnapshot()
  })

  it('does not alter document when converted to grouped format and back', () => {
    const ungroupedPlanning = fromGroupedNewsDoc(groupedArticle)

    expect(ungroupedPlanning.version).toBe(article.version)
    expect(sortDocument(ungroupedPlanning.document)).toEqual(sortDocument(article.document))
  })

  it('does not alter document when converted to Y.Doc and back', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(groupedArticle, yDoc)

    const { documentResponse } = fromYjsNewsDoc(yDoc)
    const ungroupedArticle = fromGroupedNewsDoc(documentResponse)

    expect(ungroupedArticle.version).toBe(article.version)
    expect(sortDocument(ungroupedArticle.document)).toEqual(sortDocument(article.document))
  })
})


describe('Description and slugline handling in planning', () => {
  describe('slugline', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(
      toGroupedNewsDoc(planning),
      yDoc
    )

    const ele = yDoc.getMap('ele')
    const meta = ele.get('meta') as Y.Map<unknown>

    it('adds slugline to planning and assignment', () => {
      const sluglineBefore = planning.document?.meta.find((meta) => meta.type === 'tt/slugline')
      expect(sluglineBefore).toBeUndefined()

      const createdSlugline = (meta.get('tt/slugline') as Y.Map<unknown>).toJSON()

      // A slugline is created on the planning document
      expect(createdSlugline).toEqual(YBlock.create({ type: 'tt/slugline' }))
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

    it('removes empty sluglines from assignments when reverting', () => {
      // Revert to newsDoc
      const { documentResponse } = fromYjsNewsDoc(yDoc)
      const { document } = fromGroupedNewsDoc(documentResponse)

      // Created and unused slugline on planning is removed
      const planningSlugline = document?.meta.filter((meta) => meta.type === 'tt/slugline')
      expect(planningSlugline).toHaveLength(0)

      const revertedAssignments = document?.meta.filter((meta) => meta.type === 'core/assignment')

      // First assignment slugline is kept
      const firstRevertedAssignment = revertedAssignments?.[0].meta.filter((meta) => meta.type === 'tt/slugline')
      expect(firstRevertedAssignment).toHaveLength(1)
      expect(firstRevertedAssignment?.[0].value).toBe('lands-tomasson')

      // Second assignment slugline is removed
      const secondRevertedAssignment = revertedAssignments?.[1].meta.filter((meta) => meta.type === 'tt/slugline')
      expect(secondRevertedAssignment).toHaveLength(0)
    })
  })


  describe('Descriptions when empty', () => {
    const yDoc = new Y.Doc()
    toYjsNewsDoc(
      toGroupedNewsDoc(planning),
      yDoc
    )

    const ele = yDoc.getMap('ele')
    const meta = ele.get('meta') as Y.Map<unknown>

    it('adds two descriptions (public and internal)', () => {
      const planningDescriptions = planning.document?.meta.filter((meta) => meta.type === 'core/description')
      expect(planningDescriptions?.length).toBe(0)

      const descriptions = meta.get('core/description') as Y.Array<Y.Map<unknown>>
      expect(descriptions.length).toBe(2)
      expect(descriptions.map((d) => d.get('role'))).toEqual(['internal', 'public'])
    })

    it('removes empty descriptions when reverting', () => {
      // Revert to newsDoc
      const { documentResponse } = fromYjsNewsDoc(yDoc)
      const { document, version } = fromGroupedNewsDoc(documentResponse)

      expect(version).toBe(planning.version)
      expect(document.meta.filter((meta) => meta.type === 'core/description').length).toBe(0)
      expect(sortDocument(document)).toEqual(sortDocument(planning.document))
    })
  })

  describe('Description one exists', () => {
    const augmentedPlanning: GetDocumentResponse = {
      ...planning,
      document: {
        ...planning.document as unknown as Document,
        meta: [
          ...(planning.document?.meta || []),
          Block.create({
            type: 'core/description',
            data: { text: 'hojhoj' },
            role: 'internal'
          })
        ]
      }
    }

    const yDoc = new Y.Doc()
    toYjsNewsDoc(
      toGroupedNewsDoc(augmentedPlanning),
      yDoc
    )

    it('adds one when one of other type exists', () => {
      const planningDescriptions = augmentedPlanning.document?.meta.filter((meta) => meta.type === 'core/description')
      expect(planningDescriptions?.length).toBe(1)

      const meta = yDoc.getMap('ele').get('meta') as Y.Map<unknown>
      const descriptions = meta.get('core/description') as Y.Array<Y.Map<unknown>>

      expect(descriptions.length).toBe(2)
      expect(descriptions.map((d) => d.get('role'))).toEqual(['internal', 'public'])
    })

    it('removes them when reverting', () => {
      // Revert to newsDoc
      const { documentResponse } = fromYjsNewsDoc(yDoc)
      const { document, version } = fromGroupedNewsDoc(documentResponse)

      expect(version).toBe(planning.version)
      expect(document?.meta.filter((meta) => meta.type === 'core/description').length).toBe(1)
      expect(sortDocument(document)).toEqual(sortDocument(augmentedPlanning.document))
    })
  })

  describe('Transform and revert planning with factbox document', () => {
    it('transforms and reverts the planning with factbox document correctly', () => {
      const yDoc = new Y.Doc()
      toYjsNewsDoc(
        toGroupedNewsDoc(articleFactbox),
        yDoc
      )

      const { documentResponse } = fromYjsNewsDoc(yDoc)
      const { document, version } = fromGroupedNewsDoc(documentResponse)

      if (!document || !articleFactbox.document) {
        throw new Error('no document')
      }

      expect(version).toBe(articleFactbox.version)
      expect(sortDocument(document)).toEqual(sortDocument(articleFactbox.document))
    })
  })
})
