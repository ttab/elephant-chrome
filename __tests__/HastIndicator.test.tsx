import { render } from '@testing-library/react'
import { HastIndicator } from '@/components/HastIndicator'

const mockMutate = vi.fn()
let mockSWRData: bigint | false = false
let mockSWRError: Error | null = null
let mockHasHastFlag = true
let mockWorkflowStatus: { usableId?: bigint, name?: string } = {}

vi.mock('swr', () => ({
  default: (key: unknown) => ({
    data: key ? mockSWRData : undefined,
    error: key ? mockSWRError : null,
    mutate: mockMutate
  })
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { accessToken: 'test-token' } })
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ repository: {} })
}))

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ hasHast: mockHasHastFlag })
}))

vi.mock('@/hooks/useWorkflowStatus', () => ({
  useWorkflowStatus: () => [mockWorkflowStatus]
}))

let repositoryEventCallback: ((event: { uuid?: string, event?: string }) => void) | null = null
vi.mock('@/hooks/useRepositoryEvents', () => ({
  useRepositoryEvents: vi.fn((
    _eventTypes: string[],
    callback: (event: { uuid?: string, event?: string }) => void
  ) => {
    repositoryEventCallback = callback
  })
}))

describe('HastIndicator', () => {
  beforeEach(() => {
    mockSWRData = false
    mockSWRError = null
    mockHasHastFlag = true
    mockWorkflowStatus = { usableId: 5n, name: 'usable' }
    mockMutate.mockClear()
  })

  it('renders nothing when hastValue is false (no hast block)', () => {
    mockSWRData = false
    const { container } = render(<HastIndicator documentId='test-doc' />)

    expect(container.firstChild).toBeNull()
  })

  it('renders red icon when hast targets next version', () => {
    // hastValue=6, usableId=5 -> active (targets next version)
    mockSWRData = 6n
    mockWorkflowStatus = { usableId: 5n, name: 'draft' }
    render(<HastIndicator documentId='test-doc' />)

    const icon = document.querySelector('svg')
    expect(icon).toBeDefined()
    expect(icon?.classList.contains('text-red-500')).toBe(true)
  })

  it('renders red icon when document is usable and hast targets current version', () => {
    // hastValue=5, usableId=5, isUsable=true -> active
    mockSWRData = 5n
    mockWorkflowStatus = { usableId: 5n, name: 'usable' }
    render(<HastIndicator documentId='test-doc' />)

    const icon = document.querySelector('svg')
    expect(icon).toBeDefined()
    expect(icon?.classList.contains('text-red-500')).toBe(true)
  })

  it('renders muted icon when hast is disabled (value=0)', () => {
    mockSWRData = 0n
    render(<HastIndicator documentId='test-doc' />)

    const icon = document.querySelector('svg')
    expect(icon).toBeDefined()
    expect(icon?.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('renders muted icon when hast targets current version but not usable', () => {
    // hastValue=5, usableId=5, isUsable=false -> inactive
    mockSWRData = 5n
    mockWorkflowStatus = { usableId: 5n, name: 'draft' }
    render(<HastIndicator documentId='test-doc' />)

    const icon = document.querySelector('svg')
    expect(icon).toBeDefined()
    expect(icon?.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('renders orange warning icon on fetch error', () => {
    mockSWRError = new Error('Fetch failed')
    render(<HastIndicator documentId='test-doc' />)

    const icon = document.querySelector('svg')
    expect(icon).toBeDefined()
    expect(icon?.classList.contains('text-orange-400')).toBe(true)
    expect(icon?.getAttribute('aria-label')).toBe('Failed to load hast status')
  })

  it('renders nothing when feature flag is disabled', () => {
    mockHasHastFlag = false
    mockSWRData = 6n
    const { container } = render(<HastIndicator documentId='test-doc' />)

    expect(container.firstChild).toBeNull()
  })

  it('applies custom size to icon', () => {
    mockSWRData = 6n
    render(<HastIndicator documentId='test-doc' size={20} />)

    const icon = document.querySelector('svg')
    expect(icon?.getAttribute('width')).toBe('20')
    expect(icon?.getAttribute('height')).toBe('20')
  })
})

describe('repository event handling', () => {
  beforeEach(() => {
    repositoryEventCallback = null
    mockSWRData = 6n
    mockWorkflowStatus = { usableId: 5n, name: 'usable' }
    mockMutate.mockClear()
  })

  it('calls mutate when document event matches documentId', () => {
    render(<HastIndicator documentId='test-doc' />)

    repositoryEventCallback?.({ uuid: 'test-doc', event: 'document' })

    expect(mockMutate).toHaveBeenCalled()
  })

  it('does not call mutate for status events (handled by useWorkflowStatus)', () => {
    render(<HastIndicator documentId='test-doc' />)

    repositoryEventCallback?.({ uuid: 'test-doc', event: 'status' })

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does not call mutate when event uuid does not match', () => {
    render(<HastIndicator documentId='test-doc' />)

    repositoryEventCallback?.({ uuid: 'other-doc', event: 'document' })

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does not call mutate for other event types', () => {
    render(<HastIndicator documentId='test-doc' />)

    repositoryEventCallback?.({ uuid: 'test-doc', event: 'delete_document' })

    expect(mockMutate).not.toHaveBeenCalled()
  })
})
