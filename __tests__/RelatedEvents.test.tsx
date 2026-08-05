import { render, screen } from '@testing-library/react'
import { RelatedEvents } from '@/views/Planning/components/RelatedEvents'
import { useDocuments } from '@/hooks/index/useDocuments'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { SWRResponse } from 'swr'
import type { ReactNode } from 'react'

vi.mock('@/hooks/index/useDocuments', () => ({
  useDocuments: vi.fn()
}))

// Stub Link so we don't need navigation context; only care about the rendered text.
vi.mock('@/components/index', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>
}))

const mockedUseDocuments = vi.mocked(useDocuments)

function mockDocuments(data: HitV1[] | undefined): void {
  mockedUseDocuments.mockReturnValue({
    data
  } as unknown as SWRResponse<HitV1[], Error>)
}

function eventHit(id: string, title: string): HitV1 {
  return {
    id,
    fields: {
      'document.title': { values: [title] }
    }
  } as unknown as HitV1
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RelatedEvents', () => {
  const eventBlock = Block.create({
    type: 'core/event',
    uuid: 'event-1',
    title: 'Stale headline',
    rel: 'event'
  })

  it('renders the live title from the index instead of the stored snapshot', () => {
    mockDocuments([eventHit('event-1', 'Fresh headline')])

    render(<RelatedEvents events={[eventBlock]} />)

    expect(screen.getByText('Fresh headline')).toBeInTheDocument()
    expect(screen.queryByText('Stale headline')).not.toBeInTheDocument()
  })

  it('falls back to the stored snapshot title when the event is not resolvable', () => {
    mockDocuments([])

    render(<RelatedEvents events={[eventBlock]} />)

    expect(screen.getByText('Stale headline')).toBeInTheDocument()
  })

  it('renders nothing when there are no related events', () => {
    mockDocuments([])

    const { container } = render(<RelatedEvents events={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
