import { render, screen } from '@testing-library/react'
import {
  getUnpublishTransitionFor,
  getWorkflowSpecifications
} from '@/defaults/workflowSpecification'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import type { Status } from '@/shared/Repository'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query as unknown,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn()

let mockDocumentStatus: Status | undefined
let mockWorkflowType: string | undefined = 'core/article'

const setDocumentStatusMock = vi.fn()
const mutateMock = vi.fn()

vi.mock('@/hooks/useWorkflowStatus', () => ({
  useWorkflowStatus: () => [mockDocumentStatus, setDocumentStatusMock, mutateMock]
}))

vi.mock('@/hooks/index/useWorkflow', () => ({
  useWorkflow: () => {
    if (!mockWorkflowType) {
      return { workflow: {}, statuses: {} }
    }
    const workflow = getWorkflowSpecifications()[mockWorkflowType] || {}
    // Mimic the runtime: backend returns a status list, we project it through
    // getStatusSpecifications. For the test, include every state defined in
    // the workflow so the menu has the same filter surface as production.
    const statuses = Object.keys(workflow).reduce<Record<string, { icon: unknown, className: string }>>((acc, name) => {
      acc[name] = { icon: () => null, className: '' }
      return acc
    }, {})
    return { workflow, statuses }
  }
}))

vi.mock('@/hooks/index', async () => {
  const actual = await vi.importActual<object>('@/hooks/index')
  return {
    ...actual,
    useView: () => ({ viewId: 'view-1' }),
    useNavigation: () => ({
      state: { content: [], viewRegistry: new Map() },
      dispatch: vi.fn()
    }),
    useHistory: () => ({ push: vi.fn(), replace: vi.fn() })
  }
})

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ repository: { saveMeta: vi.fn() } })
}))

vi.mock('@/components/DocumentStatus/PromptDefault', () => ({
  PromptDefault: () => null
}))

vi.mock('@/components/DocumentStatus/PromptSchedule', () => ({
  PromptSchedule: () => null
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('@/components/Link/lib/handleLink', () => ({ handleLink: vi.fn() }))

const mockYdoc = {
  id: 'doc-1',
  isChanged: false,
  ele: {} as Y.Map<unknown>,
  provider: undefined
} as unknown as YDocument<Y.Map<unknown>>

const renderMenu = () => render(<StatusMenu ydoc={mockYdoc} planningId='plan-1' />)

const openMenu = async () => {
  const { default: userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()
  const trigger = screen.getByRole('button')
  await user.click(trigger)
  return user
}

beforeEach(() => {
  setDocumentStatusMock.mockClear()
  mutateMock.mockClear()
  mockWorkflowType = 'core/article'
  mockDocumentStatus = undefined
})

describe('getUnpublishTransitionFor', () => {
  it('returns the canonical usable→unpublished transition for deliverables', () => {
    const transition = getUnpublishTransitionFor('core/article')
    expect(transition).toBeDefined()
    expect(transition?.title).toBe('Avpublicera')
  })

  it('returns an unpublish transition for every type that defines one', () => {
    // Title text differs per type (e.g. factbox uses "Kasta"), so just assert
    // the transition is defined and has a title.
    for (const type of [
      'core/article',
      'core/flash',
      'core/event',
      'core/planning-item',
      'core/factbox',
      'core/editorial-info',
      'tt/print-article'
    ]) {
      const transition = getUnpublishTransitionFor(type)
      expect(transition, `no unpublish transition for ${type}`).toBeDefined()
      expect(transition?.title, `empty title for ${type}`).toBeTruthy()
    }
  })

  it('returns undefined for unknown types', () => {
    expect(getUnpublishTransitionFor('tt/wire')).toBeUndefined()
    expect(getUnpublishTransitionFor('does/not-exist')).toBeUndefined()
    expect(getUnpublishTransitionFor(undefined)).toBeUndefined()
  })
})

describe('StatusMenu unpublish injection', () => {
  it('injects the unpublish option on a draft article that has been published', async () => {
    mockDocumentStatus = {
      uuid: 'doc-1',
      type: 'core/article',
      name: 'draft',
      version: 5n,
      usableId: 42n
    }
    renderMenu()
    await openMenu()

    const items = screen.getAllByRole('menuitem')
    const titles = items.map((item) => item.textContent || '')
    expect(titles.some((t) => t.includes('Avpublicera'))).toBe(true)
  })

  it('does not inject unpublish for a never-published draft article', async () => {
    mockDocumentStatus = {
      uuid: 'doc-1',
      type: 'core/article',
      name: 'draft',
      version: 0n,
      usableId: undefined
    }
    renderMenu()
    await openMenu()

    const items = screen.getAllByRole('menuitem')
    const titles = items.map((item) => item.textContent || '')
    expect(titles.some((t) => t.includes('Avpublicera'))).toBe(false)
  })

  it('does not duplicate the unpublish option when already exposed by the workflow state', async () => {
    mockDocumentStatus = {
      uuid: 'doc-1',
      type: 'core/article',
      name: 'usable',
      version: 5n,
      usableId: 42n
    }
    renderMenu()
    await openMenu()

    const items = screen.getAllByRole('menuitem')
    const unpublishItems = items.filter((item) => item.textContent?.includes('Avpublicera'))
    expect(unpublishItems).toHaveLength(1)
  })

  it('does not inject unpublish when current state is already unpublished', async () => {
    mockDocumentStatus = {
      uuid: 'doc-1',
      type: 'core/article',
      name: 'unpublished',
      version: 5n,
      usableId: 42n
    }
    renderMenu()
    await openMenu()

    const items = screen.getAllByRole('menuitem')
    const unpublishItems = items.filter((item) => item.textContent?.includes('Avpublicera'))
    expect(unpublishItems).toHaveLength(0)
  })

  // tt/wire is not exercised at the rendering level: StatusMenu makes
  // several unguarded lookups (`documentTypeValueFormat[type]`,
  // `getWorkflowSpecifications()[type][name]`) that pre-date this change and
  // assume tt/wire never reaches the component (it doesn't - useWorkflow
  // returns empty statuses and the early return short-circuits). The defensive
  // `type !== 'tt/wire'` guard in the injection logic is verified at the
  // helper level (getUnpublishTransitionFor('tt/wire') is undefined) above.

  it('injects unpublish for a non-deliverable type (core/factbox) currently in draft', async () => {
    mockWorkflowType = 'core/factbox'
    mockDocumentStatus = {
      uuid: 'doc-1',
      type: 'core/factbox',
      name: 'draft',
      version: 5n,
      usableId: 42n
    }
    renderMenu()
    await openMenu()

    // factbox uses "Kasta" for its unpublish transition title (the canonical
    // usable→unpublished entry); the injection should add it to draft state.
    const items = screen.getAllByRole('menuitem')
    const titles = items.map((item) => item.textContent || '')
    expect(titles.some((t) => t.includes('Kasta'))).toBe(true)
  })
})
