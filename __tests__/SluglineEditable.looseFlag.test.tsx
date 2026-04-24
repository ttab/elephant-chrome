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

vi.mock('@/modules/yjs/hooks', () => ({
  useYPath: () => mockPath,
  useYValue: (_root: unknown, path: unknown) => {
    if (Array.isArray(path) && path[0] === 'meta' && path[1] === 'core/assignment') {
      return [assignmentsFixture]
    }
    if (typeof path === 'string' && path.startsWith('core/assignment.')) {
      return [inProgressFixture]
    }
    // slugLine at the provided path — irrelevant for this test since editable=true requires non-usable.
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

// Capture compareValues passed to Validation without rendering its real children.
const validationSpy = vi.fn()
vi.mock('@/components/Validation', () => ({
  Validation: (props: { compareValues?: string[] }) => {
    validationSpy(props.compareValues)
    return null
  }
}))

// TextBox requires Y.XmlText; it's not rendered thanks to the Validation mock returning null,
// but the import must still resolve.
vi.mock('@/components/ui', () => ({
  TextBox: () => null
}))

const mockYdoc = {
  ele: {} as Y.Map<unknown>,
  ctx: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

describe('SluglineEditable — hasLooseSlugline flag', () => {
  beforeEach(() => {
    validationSpy.mockClear()
  })

  it('collects sibling sluglines as compareValues when the flag is off (default)', () => {
    mockHasLooseSlugline = false
    render(<SluglineEditable ydoc={mockYdoc} />)
    expect(validationSpy).toHaveBeenCalled()
    const compareValues = validationSpy.mock.calls[0][0] as string[]
    expect(compareValues).toEqual(expect.arrayContaining(['alpha', 'beta', 'wip']))
    expect(compareValues).toHaveLength(3)
  })

  it('passes an empty compareValues list when hasLooseSlugline is on', () => {
    mockHasLooseSlugline = true
    render(<SluglineEditable ydoc={mockYdoc} />)
    expect(validationSpy).toHaveBeenCalled()
    expect(validationSpy.mock.calls[0][0]).toEqual([])
  })
})
