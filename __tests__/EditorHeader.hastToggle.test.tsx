import { render, screen } from '@testing-library/react'
import { EditorHeader } from '@/views/Editor/EditorHeader'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

// Mock HastToggle so we can check the render condition in EditorHeader
// without setting up Yjs / feature-flag plumbing (covered by HastToggle.test.tsx).
vi.mock('@/components/HastToggle', () => ({
  HastToggle: () => <div data-testid='hast-toggle' />
}))

// Mock HastIndicator (only used in the readOnly branch we are not testing).
vi.mock('@/components/HastIndicator', () => ({
  HastIndicator: () => null
}))

// Other header pieces we do not exercise in this test.
vi.mock('@/components/Newsvalue', () => ({ Newsvalue: () => null }))
vi.mock('@/components/Notes/AddNote', () => ({ AddNote: () => null }))
vi.mock('@/components/MetaSheet/MetaSheet', () => ({ MetaSheet: () => null }))
vi.mock('@/components/DocumentStatus/StatusMenu', () => ({ StatusMenu: () => null }))
vi.mock('@/components/View', () => ({
  ViewHeader: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: () => null,
    Action: () => null,
    RemoteUsers: () => null
  }
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/components/Link/lib/handleLink', () => ({ handleLink: vi.fn() }))
vi.mock('@/lib/index/updateAssignmentPublishTime', () => ({
  updateAssignmentTime: vi.fn()
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: undefined })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/defaults/documentTypeFormats', () => ({
  documentTypeValueFormat: {}
}))

let mockDocumentType: string | undefined = 'core/article'

vi.mock('@/hooks', () => ({
  useView: () => ({ viewId: 'view-1' }),
  useNavigation: () => ({
    state: { content: [], viewRegistry: new Map() },
    dispatch: vi.fn()
  }),
  useHistory: () => ({ push: vi.fn() }),
  useLink: () => () => vi.fn(),
  useRegistry: () => ({ repository: undefined }),
  useWorkflowStatus: () => [{ type: mockDocumentType, usableId: 0n }],
  useDocumentSnapshot: () => ({ data: undefined, error: undefined })
}))

vi.mock('@/hooks/useDeliverableInfo', () => ({
  useDeliverableInfo: () => ({ planningUuid: '' })
}))

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [undefined]
}))

const mockYdoc = {
  id: 'doc-1',
  ele: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

describe('EditorHeader HAST toggle visibility', () => {
  it('renders HastToggle for core/article', () => {
    mockDocumentType = 'core/article'
    render(<EditorHeader ydoc={mockYdoc} />)
    expect(screen.getByTestId('hast-toggle')).toBeInTheDocument()
  })

  it('renders HastToggle for core/article#timeless', () => {
    mockDocumentType = 'core/article#timeless'
    render(<EditorHeader ydoc={mockYdoc} />)
    expect(screen.getByTestId('hast-toggle')).toBeInTheDocument()
  })

  it('does not render HastToggle for unrelated document types', () => {
    mockDocumentType = 'core/editorial-info'
    render(<EditorHeader ydoc={mockYdoc} />)
    expect(screen.queryByTestId('hast-toggle')).not.toBeInTheDocument()
  })
})
