import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'

import { submitTimeless } from '@/views/TimelessCreation/lib/submitTimeless'
import { createNewTimelessArticle } from '@/views/TimelessCreation/lib/createNewTimelessArticle'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'

vi.mock('@/views/TimelessCreation/lib/createNewTimelessArticle', () => ({
  createNewTimelessArticle: vi.fn()
}))
vi.mock('@/lib/index/addAssignment', () => ({
  addAssignmentWithDeliverable: vi.fn()
}))

const mockedCreate = vi.mocked(createNewTimelessArticle)
const mockedAddAssignment = vi.mocked(addAssignmentWithDeliverable)

const baseArgs = (): Parameters<typeof submitTimeless>[0] => ({
  repository: {} as Repository,
  session: { accessToken: 'tok' } as Session,
  id: 'doc-1',
  title: 'Title',
  category: Block.create({ type: 'core/timeless-category', uuid: 'cat-1' }),
  newsvalue: '3',
  slugline: 'slug',
  section: undefined,
  language: 'sv-se',
  planningContext: { planningId: 'plan-1' },
  localDate: '2026-05-04',
  isoDateTime: '2026-05-04T00:00:00Z'
})

describe('submitTimeless', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the timeless article, links it to planning, and resolves with the new id', async () => {
    mockedCreate.mockResolvedValue('doc-1')
    mockedAddAssignment.mockResolvedValue('plan-1')

    const newId = await submitTimeless(baseArgs())

    expect(newId).toBe('doc-1')
    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(mockedAddAssignment).toHaveBeenCalledTimes(1)
    expect(mockedAddAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        deliverableId: 'doc-1',
        type: 'timeless',
        planningId: 'plan-1',
        publicVisibility: false
      })
    )
  })

  it('does not call addAssignmentWithDeliverable when createNewTimelessArticle throws', async () => {
    const failure = new Error('Cannot create timeless article')
    mockedCreate.mockRejectedValue(failure)

    await expect(submitTimeless(baseArgs())).rejects.toBe(failure)

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(mockedAddAssignment).not.toHaveBeenCalled()
  })

  it('throws "Planning link failed" when addAssignmentWithDeliverable resolves to undefined', async () => {
    mockedCreate.mockResolvedValue('doc-1')
    mockedAddAssignment.mockResolvedValue(undefined)

    await expect(submitTimeless(baseArgs())).rejects.toThrow('Planning link failed')

    expect(mockedCreate).toHaveBeenCalledTimes(1)
    expect(mockedAddAssignment).toHaveBeenCalledTimes(1)
  })
})
