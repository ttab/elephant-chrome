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

// Capture props passed to Validation without rendering its real children.
const validationSpy = vi.fn()
vi.mock('@/components/Validation', () => ({
  Validation: (props: { compareValues?: string[], onValidation?: unknown }) => {
    validationSpy(props)
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
    const onValidation = vi.fn()
    render(<SluglineEditable ydoc={mockYdoc} onValidation={onValidation} />)
    expect(validationSpy).toHaveBeenCalled()
    const props = validationSpy.mock.calls[0][0] as { compareValues: string[], onValidation: unknown }
    expect(props.compareValues).toEqual(expect.arrayContaining(['alpha', 'beta', 'wip']))
    expect(props.compareValues).toHaveLength(3)
    expect(props.onValidation).toBe(onValidation)
  })

  it('passes an empty compareValues list and drops onValidation when hasLooseSlugline is on', () => {
    mockHasLooseSlugline = true
    const onValidation = vi.fn()
    render(<SluglineEditable ydoc={mockYdoc} onValidation={onValidation} />)
    expect(validationSpy).toHaveBeenCalled()
    const props = validationSpy.mock.calls[0][0] as { compareValues: string[], onValidation: unknown }
    expect(props.compareValues).toEqual([])
    expect(props.onValidation).toBeUndefined()
  })
})
