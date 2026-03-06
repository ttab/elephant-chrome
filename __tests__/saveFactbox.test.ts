import type { Mock } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'

vi.mock('@slate-yjs/core', () => ({
  yTextToSlateElement: vi.fn()
}))

vi.mock('@/shared/transformations/newsdoc/core/factbox', () => ({
  revertFactbox: vi.fn()
}))

vi.mock('@ttab/elephant-api/newsdoc', () => ({
  Document: {
    create: vi.fn().mockReturnValue({})
  }
}))

vi.mock('@ttab/textbit', () => ({
  TextbitElement: {
    isElement: vi.fn()
  }
}))

vi.mock('sonner')

import { saveFactbox } from '@/lib/saveFactbox'
import { yTextToSlateElement } from '@slate-yjs/core'
import { revertFactbox } from '@/shared/transformations/newsdoc/core/factbox'
import { TextbitElement } from '@ttab/textbit'
import { toast } from 'sonner'
import type { Repository } from '@/shared/Repository'

const TEST_ID = 'test-factbox-id'

const mockFactboxElement = {
  type: 'core/factbox',
  properties: { original_id: TEST_ID }
}

describe('saveFactbox', () => {
  let mockRepository: Repository

  const makeParams = (overrides: Record<string, unknown> = {}) => ({
    id: TEST_ID,
    content: new Y.XmlText(),
    repository: mockRepository,
    documentLanguage: 'sv-se',
    accessToken: 'token-123',
    onClose: vi.fn(),
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockRepository = {
      saveDocument: vi.fn()
    } as unknown as Repository

    vi.mocked(TextbitElement.isElement).mockReturnValue(true)
    vi.mocked(yTextToSlateElement).mockReturnValue({ children: [mockFactboxElement] } as unknown as ReturnType<typeof yTextToSlateElement>)
    vi.mocked(revertFactbox).mockReturnValue({ title: 'Title', content: [] } as unknown as ReturnType<typeof revertFactbox>)
  })

  it('should throw error if passed parameters are incomplete', async () => {
    const params = makeParams({ id: '' })
    await expect(saveFactbox(params as unknown as Parameters<typeof saveFactbox>[0]))
      .rejects.toThrow('Could not save factbox: missing data')
  })

  it('should throw error if there is no documentLanguage', async () => {
    const params = makeParams({ documentLanguage: '' })
    await expect(saveFactbox(params as unknown as Parameters<typeof saveFactbox>[0]))
      .rejects.toThrow('Could not save factbox: document language missing')
  })

  it('returns correctly, a factbox document is created', async () => {
    (mockRepository.saveDocument as Mock).mockResolvedValue(undefined)

    const params = makeParams()
    await expect(saveFactbox(params as unknown as Parameters<typeof saveFactbox>[0]))
      .resolves.toBeUndefined()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.saveDocument).toHaveBeenCalledWith({}, 'token-123', 'usable')
    expect(toast.success).toHaveBeenCalledWith('Faktarutan har sparats')
    expect(params.onClose).toHaveBeenCalled()
  })
})
