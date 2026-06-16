import { render, screen, renderHook } from '@testing-library/react'
import { OriginLinks, useSourceDocumentInfo } from '@/components/OriginLinks'
import { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

let mockCurrentType = 'core/article'
let mockArticleLinks: Block[] | undefined
let mockTimelessLinks: Block[] | undefined
let mockPlanningUuid: string | undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: (_ele: unknown, path: string) => {
    if (path === 'root.type') {
      return [mockCurrentType]
    }
    if (path === 'links.core/article') {
      return [mockArticleLinks]
    }
    if (path === 'links.core/article#timeless') {
      return [mockTimelessLinks]
    }
    return [undefined]
  }
}))

vi.mock('@/hooks/useDeliverableInfo', () => ({
  useDeliverableInfo: (uuid: string) => uuid ? { planningUuid: mockPlanningUuid } : undefined
}))

vi.mock('@/components', () => ({
  Link: ({
    children,
    props,
    to,
    target
  }: {
    children: React.ReactNode
    props: { id: string }
    to: string
    target?: string
  }) => (
    <a data-testid='link' data-id={props.id} data-to={to} data-target={target}>
      {children}
    </a>
  )
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

const mockYdoc = {
  id: 'doc-id',
  ele: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

describe('useSourceDocumentInfo', () => {
  beforeEach(() => {
    mockCurrentType = 'core/article'
    mockArticleLinks = undefined
    mockTimelessLinks = undefined
    mockPlanningUuid = undefined
  })

  it('returns null when no source link is present', () => {
    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toBeNull()
  })

  it('reads from the timeless bucket when current type is article', () => {
    mockCurrentType = 'core/article'
    mockTimelessLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'timeless-uuid'
    })]
    mockArticleLinks = [Block.create({
      type: 'core/article',
      rel: 'source-document',
      uuid: 'should-not-be-picked'
    })]
    mockPlanningUuid = 'plan-uuid'

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toEqual({
      sourceUuid: 'timeless-uuid',
      sourceType: 'core/article#timeless',
      sourcePlanningId: 'plan-uuid'
    })
  })

  it('reads from the article bucket when current type is timeless', () => {
    mockCurrentType = 'core/article#timeless'
    mockArticleLinks = [Block.create({
      type: 'core/article',
      rel: 'source-document',
      uuid: 'article-uuid'
    })]
    mockTimelessLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'should-not-be-picked'
    })]

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toMatchObject({
      sourceUuid: 'article-uuid',
      sourceType: 'core/article'
    })
  })

  it('ignores non-source-document links in the same bucket', () => {
    mockCurrentType = 'core/article'
    mockTimelessLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'subject',
      uuid: 'unrelated-uuid'
    })]

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toBeNull()
  })

  it('returns sourcePlanningId as undefined when the deliverable lookup yields no planning', () => {
    mockCurrentType = 'core/article'
    mockTimelessLinks = [Block.create({
      type: 'core/article#timeless',
      rel: 'source-document',
      uuid: 'timeless-uuid'
    })]
    mockPlanningUuid = undefined

    const { result } = renderHook(() => useSourceDocumentInfo(mockYdoc))
    expect(result.current).toEqual({
      sourceUuid: 'timeless-uuid',
      sourceType: 'core/article#timeless',
      sourcePlanningId: undefined
    })
  })
})

describe('OriginLinks', () => {
  it('renders only the source link when no planning is associated', () => {
    render(
      <OriginLinks
        sourceUuid='timeless-uuid'
        sourceType='core/article#timeless'
        sourcePlanningId={undefined}
      />
    )
    const links = screen.getAllByTestId('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('data-id', 'timeless-uuid')
    expect(links[0]).toHaveAttribute('data-to', 'Editor')
    expect(links[0]).toHaveAttribute('data-target', 'last')
  })

  it('renders both source and planning links when a planning is associated', () => {
    render(
      <OriginLinks
        sourceUuid='timeless-uuid'
        sourceType='core/article#timeless'
        sourcePlanningId='plan-uuid'
      />
    )
    const links = screen.getAllByTestId('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('data-id', 'timeless-uuid')
    expect(links[0]).toHaveAttribute('data-to', 'Editor')
    expect(links[1]).toHaveAttribute('data-id', 'plan-uuid')
    expect(links[1]).toHaveAttribute('data-to', 'Planning')
  })

  it('uses the article label when source is an article', () => {
    render(
      <OriginLinks
        sourceUuid='article-uuid'
        sourceType='core/article'
        sourcePlanningId={undefined}
      />
    )
    expect(screen.getByTestId('link')).toHaveTextContent('editor:derivedFromArticleLink')
  })

  it('uses the timeless label when source is a timeless', () => {
    render(
      <OriginLinks
        sourceUuid='timeless-uuid'
        sourceType='core/article#timeless'
        sourcePlanningId={undefined}
      />
    )
    expect(screen.getByTestId('link')).toHaveTextContent('editor:derivedFromTimelessLink')
  })
})
