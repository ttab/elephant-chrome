import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReadOnly } from '@/components/MetaSheet/ReadOnly'
import type { EleDocument } from '@/shared/types'
import type * as Hooks from '@/hooks'

let mockSnapshot: { data?: EleDocument, error?: Error } = {}

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof Hooks>('@/hooks')
  return {
    ...actual,
    useDocumentSnapshot: () => mockSnapshot
  }
})

vi.mock('@/hooks/useDeliverableInfo', () => ({
  useDeliverableInfo: () => undefined
}))

vi.mock('@/hooks/useEditorialInfoType', () => ({
  useEditorialInfoTypes: () => []
}))

vi.mock('@/components/Version', () => ({
  Version: () => <span data-testid='version'>v</span>
}))

vi.mock('@/components/OriginLinks', () => ({
  OriginLinks: () => <span data-testid='origin-links' />
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('MetaSheet ReadOnly', () => {
  it('renders the timeless category block when type is timeless and category title is present', () => {
    mockSnapshot = {
      data: {
        type: 'core/article#timeless',
        links: {
          'core/timeless-category': [{ title: 'Sports', type: '', rel: '' }]
        }
      } as unknown as EleDocument
    }
    const { container } = render(<ReadOnly documentId='doc-1' version={undefined} />)
    expect(screen.getByText('Sports')).toBeInTheDocument()
    expect(container.querySelector('#timeless-category')).not.toBeNull()
  })

  it('does not render the category block when document is not timeless', () => {
    mockSnapshot = {
      data: {
        type: 'core/article',
        links: {
          'core/timeless-category': [{ title: 'Sports', type: '', rel: '' }]
        }
      } as unknown as EleDocument
    }
    render(<ReadOnly documentId='doc-1' version={undefined} />)
    expect(screen.queryByText('Sports')).not.toBeInTheDocument()
  })

  it('does not render the category block when timeless has no category title', () => {
    mockSnapshot = {
      data: {
        type: 'core/article#timeless',
        links: {}
      } as unknown as EleDocument
    }
    const { container } = render(<ReadOnly documentId='doc-1' version={undefined} />)
    expect(container.querySelector('#timeless-category')).toBeNull()
  })

  it('renders an inline failure message on fetch error', () => {
    mockSnapshot = { error: new Error('boom') }
    render(<ReadOnly documentId='doc-1' version={undefined} />)
    expect(screen.getByText('errors:messages.failedToLoadMetaData')).toBeInTheDocument()
  })
})
