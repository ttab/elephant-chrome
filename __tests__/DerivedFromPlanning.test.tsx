import { render, screen } from '@testing-library/react'
import { DerivedFromPlanning, useSourceDocumentInfo } from '@/components/DerivedFromPlanning'
import { Block } from '@ttab/elephant-api/newsdoc'
import { renderHook } from '@testing-library/react'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

let mockCurrentType: string = 'core/article'
let mockSourceLinks: Block[] | undefined
let mockPlanningUuid: string | undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: (_ele: unknown, path: string) => {
    if (path === 'root.type') {
      return [mockCurrentType]
    }
    if (path.startsWith('links.core/article')) {
      return [mockSourceLinks]
    }
    return [undefined]
  }
}))

vi.mock('@/hooks/useDeliverableInfo', () => ({
  useDeliverableInfo: (uuid: string) => uuid ? { planningUuid: mockPlanningUuid } : undefined
}))

vi.mock('@/components', () => ({
  Link: ({ children, props }: { children: React.ReactNode, props: { id: string } }) => (
    <a data-testid='link' data-id={props.id}>{children}</a>
  )
}))

const mockYdoc = {
  id: 'doc-id',
  ele: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

describe('useSourceDocumentInfo', () => {
  beforeEach(() => {
    mockCurrentType = 'core/article'
    mockSourceLinks = undefined
    mockPlanningUuid = undefined
  })

  it('returns null when no source link is present', () => {
    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toBeNull()
  })

  it('returns source info when current is article and timeless source-document link exists', () => {
    mockCurrentType = 'core/article'
    mockSourceLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'timeless-uuid'
    })]
    mockPlanningUuid = 'plan-uuid'

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toMatchObject({
      sourceType: 'core/article#timeless',
      sourcePlanningId: 'plan-uuid'
    })
    expect(result.current?.source.uuid).toBe('timeless-uuid')
  })

  it('returns source info when current is timeless and article source-document link exists', () => {
    mockCurrentType = 'core/article#timeless'
    mockSourceLinks = [Block.create({
      type: 'core/article',
      rel: 'source-document',
      uuid: 'article-uuid'
    })]

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current?.sourceType).toBe('core/article')
    expect(result.current?.source.uuid).toBe('article-uuid')
  })

  it('ignores non-source-document links in the same bucket', () => {
    mockCurrentType = 'core/article'
    mockSourceLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'subject',
      uuid: 'unrelated-uuid'
    })]

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toBeNull()
  })
})

describe('DerivedFromPlanning', () => {
  beforeEach(() => {
    mockCurrentType = 'core/article'
    mockSourceLinks = undefined
    mockPlanningUuid = undefined
  })

  it('renders nothing when no source-document link exists', () => {
    const { container } = render(<DerivedFromPlanning ydoc={mockYdoc} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a single source link when no planning is associated', () => {
    mockSourceLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'timeless-uuid'
    })]

    render(<DerivedFromPlanning ydoc={mockYdoc} />)
    const links = screen.getAllByTestId('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('data-id', 'timeless-uuid')
  })

  it('renders both source and planning links when a planning is associated', () => {
    mockSourceLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'timeless-uuid'
    })]
    mockPlanningUuid = 'plan-uuid'

    render(<DerivedFromPlanning ydoc={mockYdoc} />)
    const links = screen.getAllByTestId('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('data-id', 'timeless-uuid')
    expect(links[1]).toHaveAttribute('data-id', 'plan-uuid')
  })
})
