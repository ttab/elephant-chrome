import { createArticle } from '@/views/Wire/lib/createArticle'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import type { Session } from 'next-auth'
import { vi } from 'vitest'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { fromYjsNewsDoc } from '../src-srv/utils/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '../src-srv/utils/transformations/groupedNewsDoc'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'

describe('createArticle', () => {
  const sendStateless = vi.fn()
  const session = { accessToken: 'abc123' } as Session
  const provider = {
    sendStateless
  } as unknown as HocuspocusProvider

  let article: { document: Document }
  let planning: { document: Document }

  // Create reproducible UUIDs
  const mockRandomUUID = vi.spyOn(crypto, 'randomUUID')
  mockRandomUUID.mockImplementation(() => {
    const callCount = mockRandomUUID.mock.calls.length
    return `uuid-${callCount}`
  })

  // These are created in DialogView in the _real_ world
  beforeAll(() => {
    const originalPlanning = createDocument({
      template: Templates.planning,
      payload: { newsvalue: '4' }
    })
    const originalArticle = createDocument({
      template: Templates.article
    })

    const result = createArticle({
      documentId: originalArticle[0],
      document: originalArticle[1],
      title: '',
      provider,
      status: 'authenticated',
      session,
      planningDocument: originalPlanning[1],
      planningId: originalPlanning[0]
    })

    if (!result || !result.planning) {
      throw new Error('No planning document created')
    }

    if (!result || !result.planning) {
      throw new Error('No planning document created')
    }

    const planningYjs = fromYjsNewsDoc(result.planning).documentResponse
    const articleYjs = fromYjsNewsDoc(result.article).documentResponse
    article = fromGroupedNewsDoc(articleYjs)
    planning = fromGroupedNewsDoc(planningYjs)
  })

  it('should match planning snapshot', () => {
    expect(planning).toMatchSnapshot()
  })


  it('should match article snapshot', () => {
    expect(planning).toMatchSnapshot()
  })

  it('should have the same newsvalue in both planning and article', () => {
    const articleNewsvalue = article.document.meta
      .find((m: Block) => m.type === 'core/newsvalue' && m.value === '4')
    const planningNewsvalue = planning.document.meta
      .find((m: Block) => m.type === 'core/newsvalue' && m.value === '4')

    expect(articleNewsvalue).toEqual(planningNewsvalue)
  })


  it('should call sendStateless twice', () => {
    expect(sendStateless).toHaveBeenCalledTimes(2)
  })
})
