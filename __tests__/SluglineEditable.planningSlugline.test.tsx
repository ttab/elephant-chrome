import { render } from '@testing-library/react'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

// Path is always an assignment path so the code reaches the compareValues branch.
const mockPath = 'meta.core/assignment[0].meta.tt/slugline[0].value'

const assignmentsFixture = [
  { meta: { 'tt/slugline': [{ value: 'alpha' }] } },
  { meta: { 'tt/slugline': [{ value: 'beta' }] } }
]
const inProgressFixture = { meta: { 'tt/slugline': [{ value: 'wip' }] } }

let mockHasLooseSlugline = false
let mockPlanningSlugline: string | undefined = 'planning-slug'

vi.mock('@/modules/yjs/hooks', () => ({
  useYPath: () => mockPath,
  useYValue: (_root: unknown, path: unknown) => {
    if (Array.isArray(path) && path[0] === 'meta' && path[1] === 'core/assignment') {
      return [assignmentsFixture]
    }

    if (typeof path === 'string' && path.startsWith('core/assignment.')) {
      return [inProgressFixture]
    }

    if (path === 'meta.tt/slugline[0].value') {
      return [mockPlanningSlugline]
    }

    // slugLine at the provided path — irrelevant since editable=true requires non-usable.
    return [undefined]
  }
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ featureFlags: { hasLooseSlugline: mockHasLooseSlugline } })
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { sub: 'test-sub' } } })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Capture props passed to Validation without rendering its real children.
const validationSpy = vi.fn()
vi.mock('@/components/Validation', () => ({
  Validation: (props: { compareValues?: string[], onValidation?: unknown }) => {
    validationSpy(props)
    return null
  }
}))

// TextBox requires Y.XmlText; not rendered thanks to the Validation mock, but the import
// must still resolve.
vi.mock('@/components/ui', () => ({
  TextBox: () => null
}))

const mockYdoc = {
  ele: {} as Y.Map<unknown>,
  ctx: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

describe('SluglineEditable — planning slugline comparison', () => {
  beforeEach(() => {
    validationSpy.mockClear()
    mockHasLooseSlugline = false
    mockPlanningSlugline = 'planning-slug'
  })

  it('adds the planning slugline to compareValues so an assignment cannot reuse it', () => {
    render(<SluglineEditable ydoc={mockYdoc} onValidation={vi.fn()} />)

    expect(validationSpy).toHaveBeenCalled()
    const props = validationSpy.mock.calls[0][0] as { compareValues: string[] }
    expect(props.compareValues).toEqual(
      expect.arrayContaining(['alpha', 'beta', 'wip', 'planning-slug'])
    )
    expect(props.compareValues).toHaveLength(4)
  })

  it('does not add the planning slugline when hasLooseSlugline is on (NTB-mode)', () => {
    mockHasLooseSlugline = true

    render(<SluglineEditable ydoc={mockYdoc} onValidation={vi.fn()} />)

    expect(validationSpy).toHaveBeenCalled()
    const props = validationSpy.mock.calls[0][0] as { compareValues: string[] }
    expect(props.compareValues).toEqual([])
  })

  it('does not push an empty entry when the planning has no slugline', () => {
    mockPlanningSlugline = undefined

    render(<SluglineEditable ydoc={mockYdoc} onValidation={vi.fn()} />)

    expect(validationSpy).toHaveBeenCalled()
    const props = validationSpy.mock.calls[0][0] as { compareValues: string[] }
    expect(props.compareValues).toEqual(expect.arrayContaining(['alpha', 'beta', 'wip']))
    expect(props.compareValues).toHaveLength(3)
  })
})
