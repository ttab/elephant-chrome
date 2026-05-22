import { render } from '@testing-library/react'
import { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import { AssignmentType } from '@/components/DataItem/AssignmentType'

let mockAssignmentType: Block[] = []

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: (_doc: unknown, path: string) => {
    if (path === 'meta.core/assignment-type') {
      return [mockAssignmentType, vi.fn()]
    }
    return [undefined, vi.fn()]
  }
}))

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ hasHast: false })
}))

const mockAssignment = {} as Y.Map<unknown>

function setType(value: string) {
  mockAssignmentType = [Block.create({ type: 'core/assignment-type', value })]
}

describe('AssignmentType (readOnly icon swap)', () => {
  beforeEach(() => {
    mockAssignmentType = []
  })

  it('renders BookmarkPlusIcon for timeless when no deliverable (editable)', () => {
    setType('timeless')
    const { container } = render(
      <AssignmentType assignment={mockAssignment} editable readOnly />
    )
    expect(container.querySelector('svg.lucide-bookmark-plus')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-bookmark:not(.lucide-bookmark-plus)')).toBeNull()
  })

  it('renders BookmarkIcon for timeless when deliverable exists (not editable)', () => {
    setType('timeless')
    const { container } = render(
      <AssignmentType assignment={mockAssignment} editable={false} readOnly />
    )
    expect(container.querySelector('svg.lucide-bookmark:not(.lucide-bookmark-plus)')).toBeInTheDocument()
    expect(container.querySelector('svg.lucide-bookmark-plus')).toBeNull()
  })

  it('renders FilePlus2Icon for text when no deliverable (editable) - regression guard', () => {
    setType('text')
    const { container } = render(
      <AssignmentType assignment={mockAssignment} editable readOnly />
    )
    // lucide-react >=0.400 renamed FilePlus2Icon → class "lucide-file-plus-corner"
    expect(container.querySelector('svg.lucide-file-plus-corner')).toBeInTheDocument()
  })

  it('renders FilePenIcon for text when deliverable exists (not editable) - regression guard', () => {
    setType('text')
    const { container } = render(
      <AssignmentType assignment={mockAssignment} editable={false} readOnly />
    )
    expect(container.querySelector('svg.lucide-file-pen')).toBeInTheDocument()
  })
})
