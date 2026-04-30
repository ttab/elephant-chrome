import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as Y from 'yjs'
import { AssignmentTable } from '@/views/Planning/components/AssignmentTable'
import type { YDocument } from '@/modules/yjs/hooks'

const mockSnapshotDocument = vi.fn()

vi.mock('@/lib/snapshotDocument', () => ({
  snapshotDocument: (...args: unknown[]) => mockSnapshotDocument(...args) as unknown
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { sub: 'test-sub' } }, status: 'authenticated' })
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ featureFlags: { hasLooseSlugline: false } })
}))

vi.mock('@/hooks', () => ({
  useAuthors: () => [],
  useNavigationKeys: () => undefined,
  useRegistry: () => ({ featureFlags: { hasLooseSlugline: false } })
}))

vi.mock('@/hooks/useActiveAuthor', () => ({
  useActiveAuthor: () => undefined
}))

vi.mock('@/lib/getAuthorBySub', () => ({
  getAuthorBySub: () => undefined
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}))

// We do not exercise AssignmentRow in this test.
vi.mock('@/views/Planning/components/AssignmentRow', () => ({
  AssignmentRow: () => null
}))

// Stand-in for the inline Assignment editor: exposes onClose via a button.
vi.mock('@/views/Planning/components/Assignment', () => ({
  Assignment: ({ onClose }: { onClose?: () => void }) => (
    <button data-testid='assignment-close' onClick={onClose}>close</button>
  )
}))

function buildInProgressAssignment(): Y.Map<unknown> {
  const assignment = new Y.Map<unknown>()
  const meta = new Y.Map<unknown>()
  const types = new Y.Array<unknown>()
  const typeBlock = new Y.Map<unknown>()
  typeBlock.set('value', 'text')
  types.push([typeBlock])
  meta.set('core/assignment-type', types)
  assignment.set('meta', meta)
  return assignment
}

function buildYdoc(isInProgress: boolean): YDocument<Y.Map<unknown>> {
  const doc = new Y.Doc()
  const ele = doc.getMap('ele')
  const ctx = doc.getMap('ctx')

  const meta = new Y.Map<unknown>()
  meta.set('core/assignment', new Y.Array<unknown>())
  ele.set('meta', meta)

  const slots = new Y.Map<unknown>()
  slots.set('test-sub', buildInProgressAssignment())
  ctx.set('core/assignment', slots)

  return {
    id: 'planning-uuid',
    ele,
    ctx,
    isInProgress,
    provider: { document: doc }
  } as unknown as YDocument<Y.Map<unknown>>
}

describe('AssignmentTable.handleClose — isInProgress gate', () => {
  beforeEach(() => {
    mockSnapshotDocument.mockReset()
    mockSnapshotDocument.mockResolvedValue(undefined)
  })

  it('skips snapshotDocument when the planning is still in-progress', async () => {
    const ydoc = buildYdoc(true)
    const rawAssignments = (ydoc.ele.get('meta') as Y.Map<unknown>).get('core/assignment') as Y.Array<unknown>
    const slots = ydoc.ctx.get('core/assignment') as Y.Map<unknown>

    render(<AssignmentTable ydoc={ydoc} documentId='planning-uuid' />)

    await userEvent.click(screen.getByTestId('assignment-close'))

    expect(mockSnapshotDocument).not.toHaveBeenCalled()
    // Local mutations still happen so the assignment is part of the Y.Doc.
    expect(rawAssignments.length).toBe(1)
    expect(slots.get('test-sub')).toBeUndefined()
  })

  it('calls snapshotDocument when the planning is already persisted', async () => {
    const ydoc = buildYdoc(false)

    render(<AssignmentTable ydoc={ydoc} documentId='planning-uuid' />)

    await userEvent.click(screen.getByTestId('assignment-close'))

    expect(mockSnapshotDocument).toHaveBeenCalledTimes(1)
    expect(mockSnapshotDocument).toHaveBeenCalledWith(
      'planning-uuid',
      { force: true },
      ydoc.provider?.document
    )
  })
})
