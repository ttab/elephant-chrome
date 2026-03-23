import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock navigation lib to prevent it from importing all views
vi.mock('@/navigation/lib/initializeNavigationState', () => ({
  initializeNavigationState: vi.fn(() => ({
    viewRegistry: new Map(),
    content: [],
    navigation: []
  }))
}))

vi.mock('@/navigation/NavigationContext', () => ({
  NavigationContext: { Provider: ({ children }: { children: ReactNode }) => children }
}))

vi.mock('@/hooks', () => ({
  useQuery: vi.fn(() => [{}]),
  useLink: vi.fn(() => vi.fn()),
  useWorkflowStatus: vi.fn(() => [undefined])
}))

vi.mock('@/modules/yjs/hooks', () => ({
  useYDocument: vi.fn(() => ({
    id: 'test-doc-id',
    ele: new Map()
  }))
}))

vi.mock('@/shared/yUtils', () => ({
  getValueByYPath: vi.fn(() => [undefined])
}))

vi.mock('@/views/Editor/EditorHeader', () => ({
  EditorHeader: (props: { readOnly?: boolean, readOnlyVersion?: bigint }) => (
    <div
      data-testid='editor-header'
      data-readonly={String(!!props.readOnly)}
      data-readonly-version={props.readOnlyVersion != null ? String(props.readOnlyVersion) : ''}
    />
  )
}))

vi.mock('@/views/Error', () => ({
  Error: ({ title }: { title: string }) => <div data-testid='error'>{title}</div>
}))

vi.mock('@/components/PlainEditor', () => ({
  Editor: (props: { id: string, version?: bigint }) => (
    <div
      data-testid='plain-editor'
      data-id={props.id}
      data-version={props.version != null ? String(props.version) : ''}
    />
  )
}))

vi.mock('@/components/Editor/BaseEditor', () => ({
  BaseEditor: {
    Root: ({ children }: { children: ReactNode }) => <div data-testid='base-editor-root'>{children}</div>,
    Text: () => <div data-testid='base-editor-text' />,
    Footer: () => <div data-testid='base-editor-footer' />
  }
}))

vi.mock('@/components', () => ({
  View: {
    Root: ({ children }: { children: ReactNode }) => <div data-testid='view-root'>{children}</div>,
    Content: ({ children }: { children: ReactNode }) => <div data-testid='view-content'>{children}</div>,
    Footer: ({ children }: { children: ReactNode }) => <div data-testid='view-footer'>{children}</div>
  }
}))

vi.mock('@/components/Notes', () => ({
  Notes: () => <div data-testid='notes' />
}))

vi.mock('@/defaults/contentMenuLabels', () => ({
  contentMenuLabels: {}
}))

vi.mock('@ttab/textbit-plugins', () => ({
  Bold: vi.fn(() => ({})),
  Italic: vi.fn(() => ({})),
  Link: vi.fn(() => ({})),
  Text: vi.fn(() => ({})),
  TTVisual: vi.fn(() => ({})),
  Factbox: vi.fn(() => ({})),
  Table: vi.fn(() => ({})),
  LocalizedQuotationMarks: vi.fn(() => ({}))
}))

vi.mock('@/plugins/ImageSearch', () => ({
  ImageSearchPlugin: vi.fn(() => ({}))
}))

vi.mock('@/plugins/Factboxes', () => ({
  FactboxPlugin: vi.fn(() => ({}))
}))

import { useWorkflowStatus } from '@/hooks'
import { Editor } from '@/views/Editor'

const mockUseWorkflowStatus = vi.mocked(useWorkflowStatus)

describe('Editor readonly behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders readonly PlainEditor when status is "usable"', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'usable', version: 5n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    const header = screen.getByTestId('editor-header')
    expect(header.dataset.readonly).toBe('true')
    expect(header.dataset.readonlyVersion).toBe('5')

    expect(screen.getByTestId('plain-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('base-editor-root')).not.toBeInTheDocument()
  })

  it('renders readonly PlainEditor when status is "withheld"', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'withheld', version: 3n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    const header = screen.getByTestId('editor-header')
    expect(header.dataset.readonly).toBe('true')
    expect(header.dataset.readonlyVersion).toBe('3')

    expect(screen.getByTestId('plain-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('base-editor-root')).not.toBeInTheDocument()
  })

  it('renders readonly PlainEditor when status is "unpublished"', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'unpublished', version: 2n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    const header = screen.getByTestId('editor-header')
    expect(header.dataset.readonly).toBe('true')
    // unpublished uses BigInt(props.version ?? 0), not workflowStatus.version
    expect(header.dataset.readonlyVersion).toBe('0')

    expect(screen.getByTestId('plain-editor')).toBeInTheDocument()
  })

  it('uses workflowStatus.version for "usable" and "withheld", not props.version', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'withheld', version: 7n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    const header = screen.getByTestId('editor-header')
    expect(header.dataset.readonlyVersion).toBe('7')
  })

  it('renders editable EditorWrapper when status is "draft"', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'draft', version: 1n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    expect(screen.queryByTestId('plain-editor')).not.toBeInTheDocument()
    expect(screen.getByTestId('view-root')).toBeInTheDocument()
  })

  it('renders editable EditorWrapper when status is undefined (loading)', () => {
    mockUseWorkflowStatus.mockReturnValue([
      undefined,
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' />)

    expect(screen.queryByTestId('plain-editor')).not.toBeInTheDocument()
    expect(screen.getByTestId('view-root')).toBeInTheDocument()
  })

  it('renders error when no document id is provided', () => {
    mockUseWorkflowStatus.mockReturnValue([
      undefined,
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor />)

    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('renders readonly PlainEditor when props.version is set (regardless of status)', () => {
    mockUseWorkflowStatus.mockReturnValue([
      { uuid: 'doc-1', name: 'draft', version: 1n, type: 'core/article' },
      vi.fn(),
      vi.fn()
    ] as ReturnType<typeof useWorkflowStatus>)

    render(<Editor id='doc-1' version='3' />)

    expect(screen.getByTestId('plain-editor')).toBeInTheDocument()
    const header = screen.getByTestId('editor-header')
    expect(header.dataset.readonly).toBe('true')
  })
})
