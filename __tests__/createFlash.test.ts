import { createFlash } from '@/views/Flash/lib/createFlash'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import type { Session } from 'next-auth'
import { vi } from 'vitest'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { fromYjsNewsDoc } from '../src-srv/utils/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '../src-srv/utils/transformations/groupedNewsDoc'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { Block } from '@ttab/elephant-api/newsdoc'

const ASSIGNMENT_TITLE = 'Test flash'
const PLANNING_TITLE = 'Test planning'
const NEWSVALUE = '4'
const SECTION = 'Inrikes'
const session = { accessToken: 'abc123' } as Session


describe('createFlash', () => {
  // Create reproducible UUIDs
  const mockRandomUUID = vi.spyOn(crypto, 'randomUUID')
  mockRandomUUID.mockImplementation(() => {
    const callCount = mockRandomUUID.mock.calls.length
    return `uuid-${callCount}`
  })

  // Create a reproducible date in UTC to be compatible with CI/CD and local
  const mockDate = new Date(Date.UTC(2025, 1, 17))
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

  describe('New planning', () => {
    let flash: { document: Document }
    let planning: { document: Document }

    const sendStateless = vi.fn()
    const session = { accessToken: 'abc123' } as Session

    // Create documents for all tests, payload is the user form input
    beforeAll(() => {
      const newPlanning = createDocument({
        template: Templates.planning,
        // Flashplannings should have a default newsvalue,
        // set in FlashViewContent (now mocked)
        payload: {
          meta: {
            'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '4' })]
          }
        }
      })

      const originalFlash = createDocument({
        template: Templates.flash,
        // FIXME: Use TemplatePayload
        payload: {
          title: ASSIGNMENT_TITLE,
          section: {
            title: SECTION,
            uuid: '956636ed-2687-4bc3-a45a-7e09d98c6eeb'
          }

        }
      })

      const provider = {
        document: originalFlash[1],
        sendStateless
      } as unknown as HocuspocusProvider

      const result = createFlash({
        provider,
        status: 'authenticated',
        session,
        planning: {
          document: newPlanning[1],
          id: newPlanning[0]
        },
        hasSelectedPlanning: false
      })

      if (!result || !result.planning) {
        throw new Error('No planning document created')
      }

      if (!result || !result.flash) {
        throw new Error('No flash document created')
      }

      const planningYjs = fromYjsNewsDoc(result.planning).documentResponse
      const flashYjs = fromYjsNewsDoc(result.flash).documentResponse
      flash = fromGroupedNewsDoc(flashYjs)
      planning = fromGroupedNewsDoc(planningYjs)
    })

    describe('Snapshots', () => {
      it('should match planning snapshot', () => {
        expect(planning).toMatchSnapshot()
      })


      it('should match flash snapshot', () => {
        expect(flash).toMatchSnapshot()
      })
    })

    describe('Section', () => {
      it('should only have one section block in each document', () => {
        const flashSection = flash.document.links
          .filter((l: Block) => l.type === 'core/section')
        const planningSection = planning.document.links
          .filter((l: Block) => l.type === 'core/section')

        expect(flashSection).toHaveLength(1)
        expect(planningSection).toHaveLength(1)
      })

      it('should have the same section in both planning and article', () => {
        const flashSection = flash.document.links
          .filter((l: Block) => l.type === 'core/section')
        const planningSection = planning.document.links
          .filter((l: Block) => l.type === 'core/section')

        expect(flashSection[0].title).toEqual(SECTION)
        expect(flashSection).toEqual(planningSection)
      })
    })

    describe('Slugline', () => {
      it('should not have a slugline block, neither in flash or planning', () => {
        const flashSlugline = flash.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(flashSlugline).toHaveLength(0)
        expect(planningSlugline).toHaveLength(0)
      })
    })

    describe('Title', () => {
      it('should have the same title in planning, assignment and flash', () => {
        const assignmentTitle = planning.document.meta
          .find((m: Block) => m.type === 'core/assignment')?.title

        expect(flash.document.title).toEqual(assignmentTitle)

        expect(flash.document.title).toEqual(assignmentTitle)
        expect(planning.document.title).toEqual(assignmentTitle)
      })
    })

    describe('Misc', () => {
      it('should call sendStateless twice', () => {
        expect(sendStateless).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Existing planning', () => {
    let flash: { document: Document }
    let planning: { document: Document }

    const sendStateless = vi.fn()

    // Create documents for all tests, payload is the user form input
    beforeAll(() => {
      const existingPlanning = createDocument({
        template: Templates.planning,
        payload: {
          title: PLANNING_TITLE,
          meta: {
            'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: NEWSVALUE })]
          },
          links: {
            'core/section': [Block.create({ type: 'core/section', title: SECTION })]
          }
        }
      })

      const newFlash = createDocument({
        template: Templates.flash,
        // FIXME: Use TemplatePayload
        payload: {
          title: ASSIGNMENT_TITLE,
          section: {
            title: SECTION,
            uuid: '956636ed-2687-4bc3-a45a-7e09d98c6eeb'
          }

        }
      })

      const provider = {
        document: newFlash[1],
        sendStateless
      } as unknown as HocuspocusProvider

      const result = createFlash({
        provider,
        status: 'authenticated',
        session,
        planning: {
          document: existingPlanning[1],
          id: existingPlanning[0]
        },
        hasSelectedPlanning: true
      })

      if (!result || !result.planning) {
        throw new Error('No planning document created')
      }

      if (!result || !result.flash) {
        throw new Error('No flash document created')
      }

      const planningYjs = fromYjsNewsDoc(result.planning).documentResponse
      const flashYjs = fromYjsNewsDoc(result.flash).documentResponse
      flash = fromGroupedNewsDoc(flashYjs)
      planning = fromGroupedNewsDoc(planningYjs)
    })

    describe('Snapshots', () => {
      it('should match planning snapshot', () => {
        expect(planning).toMatchSnapshot()
      })


      it('should match flash snapshot', () => {
        expect(flash).toMatchSnapshot()
      })
    })

    describe('Section', () => {
      it('should only have one section block in each document', () => {
        const flashSection = flash.document.links
          .filter((l: Block) => l.type === 'core/section')
        const planningSection = planning.document.links
          .filter((l: Block) => l.type === 'core/section')

        expect(flashSection).toHaveLength(1)
        expect(planningSection).toHaveLength(1)
      })

      it('should have the same section in both planning and article', () => {
        const flashSection = flash.document.links
          .filter((l: Block) => l.type === 'core/section')
        const planningSection = planning.document.links
          .filter((l: Block) => l.type === 'core/section')

        expect(flashSection[0].title).toEqual(SECTION)
        expect(flashSection).toEqual(planningSection)
      })
    })

    describe('Slugline', () => {
      it('should not have a slugline block, neither in flash or planning', () => {
        const flashSlugline = flash.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')
        const planningSlugline = planning.document.meta
          .filter((m: Block) => m.type === 'tt/slugline')

        expect(flashSlugline).toHaveLength(0)
        expect(planningSlugline).toHaveLength(0)
      })
    })

    describe('Title', () => {
      it('should have different title in planning and article', () => {
        const assignmentTitle = planning.document.meta
          .find((m: Block) => m.type === 'core/assignment')?.title

        expect(flash.document.title).toEqual(ASSIGNMENT_TITLE)

        expect(flash.document.title).toEqual(assignmentTitle)
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
