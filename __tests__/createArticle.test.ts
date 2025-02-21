import { createArticle } from '@/views/Wire/lib/createArticle'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import type { Session } from 'next-auth'
import { vi } from 'vitest'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { fromYjsNewsDoc } from '../src-srv/utils/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '../src-srv/utils/transformations/groupedNewsDoc'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { Block } from '@ttab/elephant-api/newsdoc'

const session = { accessToken: 'abc123' } as Session


const ASSIGNMENT_TITLE = 'Test article'
const PLANNING_TITLE = 'Test planning'
const SLUGLINE = 'testline'
const SECTION = 'Inrikes'
const NEWSVALUE = '4'
const WIRE = {
  id: 'b2208554-0c23-59ce-9895-418f6281930d',
  score: 0,
  fields: {
    'document.title': {
      values: [
        'Líbano intensifica llamados para "presionar" a Israel para que se retire del sur del país'
      ]
    },
    'document.rel.section.uuid': {
      values: [
        '111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c'
      ]
    },
    'document.rel.section.title': {
      values: [
        'Utrikes'
      ]
    },
    'document.rel.source.uri': {
      values: [
        'wires://source/efes'
      ]
    },
    'document.meta.tt_wire.role': {
      values: [
        'article'
      ]
    },
    modified: {
      values: [
        '2025-02-17T10:52:35.000Z'
      ]
    },
    current_version: {
      values: [
        '1'
      ]
    },
    'document.meta.core_newsvalue.value': {
      values: [
        '3'
      ]
    }
  },
  source: {},
  sort: [
    '1739789555000'
  ]
}

describe('createArticle', () => {
  // Create reproducible UUIDs for all tests
  const mockRandomUUID = vi.spyOn(crypto, 'randomUUID')
  mockRandomUUID.mockImplementation(() => {
    const callCount = mockRandomUUID.mock.calls.length
    return `uuid-${callCount}`
  })

  // Create a reproducible date in UTC to be compatible with CI/CD and local
  const mockDate = new Date(Date.UTC(2025, 1, 17))
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

  describe('New planning', () => {
    let article: { document: Document }
    let planning: { document: Document }

    const sendStateless = vi.fn()


    // Create documents for tests, payload is the user form input
    beforeAll(() => {
      const newPlanning = createDocument({
        template: Templates.planning
      })

      const newArticle = createDocument({
        template: Templates.article,
        payload: {
          title: ASSIGNMENT_TITLE,
          meta: {
            'tt/slugline': [Block.create({ type: 'tt/slugline', value: SLUGLINE })],
            'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: NEWSVALUE })]
          },
          links: {
            'tt/wire': [Block.create({
              type: 'tt/wire',
              uuid: WIRE.id,
              rel: 'source-document',
              title: WIRE.fields['document.title'].values[0],
              data: {
                version: WIRE.fields['current_version'].values[0]
              }
            })
            ],
            'core/section': [Block.create({
              rel: 'subject',
              title: 'Inrikes',
              type: 'core/section',
              uuid: '956636ed-2687-4bc3-a45a-7e09d98c6eeb'
            })]
          }
        }
      })

      const provider = {
        document: newArticle[1],
        sendStateless
      } as unknown as HocuspocusProvider

      const result = createArticle({
        provider,
        status: 'authenticated',
        session,
        planning: {
          document: newPlanning[1],
          id: newPlanning[0],
          title: PLANNING_TITLE
        },
        wire: WIRE,
        hasSelectedPlanning: false
      })

      if (!result || !result.planning) {
        throw new Error('No planning document created')
      }

      if (!result || !result.article) {
        throw new Error('No article document created')
      }

      const planningYjs = fromYjsNewsDoc(result.planning).documentResponse
      const articleYjs = fromYjsNewsDoc(result.article).documentResponse
      article = fromGroupedNewsDoc(articleYjs)
      planning = fromGroupedNewsDoc(planningYjs)
    })

    describe('Snapshots', () => {
      it('should match planning snapshot', () => {
        expect(planning).toMatchSnapshot()
      })


      it('should match article snapshot', () => {
        expect(article).toMatchSnapshot()
      })
    })

    describe('Newsvalue', () => {
      it('should only have one newsvalue block in each document', () => {
        const articleNewsvalue = article.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')
        const planningNewsvalue = planning.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')

        expect(articleNewsvalue).toHaveLength(1)
        expect(planningNewsvalue).toHaveLength(1)
      })

      it('should have the same newsvalue in both planning and article', () => {
        const articleNewsvalue = article.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')
        const planningNewsvalue = planning.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')

        expect(articleNewsvalue[0].value).toEqual(NEWSVALUE)
        expect(articleNewsvalue).toEqual(planningNewsvalue)
      })
    })

    describe('Slugline', () => {
      it('should only have one slugline block in each document', () => {
        const articleslugline = article.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(articleslugline).toHaveLength(1)
        expect(planningSlugline).toHaveLength(1)
      })

      it('should have the same slugline in planning, assignment and article', () => {
        const articleslugline = article.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const assignmentSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(articleslugline[0].value).toEqual(SLUGLINE)
        expect(assignmentSlugline[0].value).toEqual(SLUGLINE)
        expect(articleslugline).toEqual(planningSlugline)
      })
    })

    describe('Title', () => {
      it('should have the same title in planning and article', () => {
        const assignmentTitle = planning.document.meta
          .find((m: Block) => m.type === 'core/assignment')?.title

        expect(article.document.title).toEqual(ASSIGNMENT_TITLE)

        expect(article.document.title).toEqual(assignmentTitle)
        expect(planning.document.title).toEqual(PLANNING_TITLE)
      })
    })

    describe('Misc', () => {
      it('should call sendStateless twice', () => {
        expect(sendStateless).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Existing planning', () => {
    let article: { document: Document }
    let planning: { document: Document }

    const sendStateless = vi.fn()


    // Create documents for tests, payload is the user form input
    beforeAll(() => {
      const existingPlanning = createDocument({
        template: Templates.planning,
        // TODO: WIRE: Harmonize payloads with article template SHOULD take Block
        payload: {
          title: PLANNING_TITLE,
          meta: {
            'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: NEWSVALUE })],
            'tt/slugline': [Block.create({ type: 'tt/slugline', value: SLUGLINE })]
          },
          links: {
            'core/section': [Block.create({
              type: 'core/section',
              title: SECTION,
              uuid: '956636ed-2687-4bc3-a45a-7e09d98c6eeb' }
            )]
          }
        }
      })

      const newArticle = createDocument({
        template: Templates.article,
        payload: {
          title: ASSIGNMENT_TITLE,
          links: {
            'tt/wire': [Block.create({
              type: 'tt/wire',
              uuid: WIRE.id,
              rel: 'source-document',
              title: WIRE.fields['document.title'].values[0],
              data: {
                version: WIRE.fields['current_version'].values[0]
              }
            })
            ]
          }
        }
      })

      const provider = {
        document: newArticle[1],
        sendStateless
      } as unknown as HocuspocusProvider

      const result = createArticle({
        provider,
        status: 'authenticated',
        session,
        planning: {
          document: existingPlanning[1],
          id: existingPlanning[0]
        },
        wire: WIRE,
        hasSelectedPlanning: true
      })

      if (!result || !result.planning) {
        throw new Error('No planning document created')
      }

      if (!result || !result.article) {
        throw new Error('No article document created')
      }

      const planningYjs = fromYjsNewsDoc(result.planning).documentResponse
      const articleYjs = fromYjsNewsDoc(result.article).documentResponse
      article = fromGroupedNewsDoc(articleYjs)
      planning = fromGroupedNewsDoc(planningYjs)
    })

    describe('Snapshots', () => {
      it('should match planning snapshot', () => {
        expect(planning).toMatchSnapshot()
      })


      it('should match article snapshot', () => {
        expect(article).toMatchSnapshot()
      })
    })

    describe('Newsvalue', () => {
      it('should only have one newsvalue block in each document', () => {
        const articleNewsvalue = article.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')
        const planningNewsvalue = planning.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')

        expect(articleNewsvalue).toHaveLength(1)
        expect(planningNewsvalue).toHaveLength(1)
      })

      it('should have the same newsvalue in both planning and article', () => {
        const articleNewsvalue = article.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')
        const planningNewsvalue = planning.document.meta
          .filter((m: Block) => m.type === 'core/newsvalue')

        expect(articleNewsvalue[0].value).toEqual(NEWSVALUE)
        expect(articleNewsvalue).toEqual(planningNewsvalue)
      })
    })

    describe('Slugline', () => {
      it('should only have one slugline block in each document', () => {
        const articleslugline = article.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(articleslugline).toHaveLength(1)
        expect(planningSlugline).toHaveLength(1)
      })

      it('should have the same slugline in both planning and article', () => {
        const articleslugline = article.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(articleslugline[0].value).toEqual(SLUGLINE)
        expect(articleslugline).toEqual(planningSlugline)
      })
    })

    describe('Title', () => {
      it('should have different title in planning and article', () => {
        const assignmentTitle = planning.document.meta
          .find((m: Block) => m.type === 'core/assignment')?.title

        expect(article.document.title).toEqual(ASSIGNMENT_TITLE)

        expect(article.document.title).toEqual(assignmentTitle)
        expect(planning.document.title).toEqual(PLANNING_TITLE)
      })
    })

    describe('Misc', () => {
      it('should call sendStateless twice', () => {
        expect(sendStateless).toHaveBeenCalledTimes(2)
      })
    })
  })
})
