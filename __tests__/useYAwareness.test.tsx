import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import {
  type YDocument,
  type YAwarenessFocus,
  type YAwarenessUser,
  useYAwareness
} from '@/modules/yjs/hooks'

import { act } from '../setupTests'

type AwarenessEntry = {
  data?: YAwarenessUser
  focus?: YAwarenessFocus
}

type MockAwareness = {
  clientID: number
  states: Map<number, AwarenessEntry>
  getStates: () => Map<number, AwarenessEntry>
  on: (event: string, handler: () => void) => void
  off: (event: string, handler: () => void) => void
  emitChange: () => void
}

const createMockAwareness = (): MockAwareness => {
  const handlers = new Set<() => void>()
  const states = new Map<number, AwarenessEntry>()

  const emitChange = () => {
    handlers.forEach((handler) => handler())
  }

  return {
    clientID: 1,
    states,
    getStates: () => states,
    on: (event, handler) => {
      if (event === 'change') {
        handlers.add(handler)
      }
    },
    off: (event, handler) => {
      if (event === 'change') {
        handlers.delete(handler)
      }
    },
    emitChange
  }
}

const createDocumentWithAwareness = (awareness: MockAwareness) => {
  const provider = {
    awareness,
    setAwarenessField: vi.fn() as (field: string, value: unknown) => void
  }

  return {
    provider
  } as unknown as YDocument<unknown>
}

describe('useYAwareness', () => {
  it('returns remote awareness states', async () => {
    const awareness = createMockAwareness()
    awareness.states.set(1, { data: { name: 'Local' } })
    awareness.states.set(2, { data: { name: 'Remote', color: 'blue' }, focus: { key: 'remote', path: '/doc' } })
    awareness.states.set(3, { focus: { key: 'remote-only' } })

    const ydoc = createDocumentWithAwareness(awareness)
    const { result } = renderHook(() => useYAwareness(ydoc, 'remote'))

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1)
    })

    expect(result.current[0][0]).toEqual({
      clientId: 2,
      data: { name: 'Remote', color: 'blue' },
      focus: { key: 'remote', path: '/doc' }
    })
  })

  it('updates when awareness change events fire', async () => {
    const awareness = createMockAwareness()
    awareness.states.set(2, { data: { name: 'Remote A' } })

    const ydoc = createDocumentWithAwareness(awareness)
    const { result } = renderHook(() => useYAwareness(ydoc, 'remote'))

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1)
    })

    act(() => {
      awareness.states.set(4, { data: { name: 'Remote B' } })
      awareness.emitChange()
    })

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(2)
    })

    expect(result.current[0].some((state) => state.clientId === 4)).toBe(true)
  })

  it('sets focus via the provider setter', () => {
    const awareness = createMockAwareness()
    const ydoc = createDocumentWithAwareness(awareness)
    const [, setFocus] = renderHook(() => useYAwareness(ydoc, 'focus-key')).result.current

    act(() => {
      setFocus(true, '/path')
    })

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(ydoc.provider?.setAwarenessField).toHaveBeenLastCalledWith(
      'focus',
      { key: 'focus-key', path: '/path' }
    )

    act(() => {
      setFocus(false)
    })

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(ydoc.provider?.setAwarenessField).toHaveBeenLastCalledWith('focus', null)
  })

  it('handles missing provider/awareness gracefully', () => {
    const ydoc = { provider: null } as YDocument<unknown>
    const { result } = renderHook(() => useYAwareness(ydoc, 'whatever'))

    expect(result.current[0]).toEqual([])

    const [, setFocus] = result.current
    act(() => {
      setFocus(true, '/path')
    })

    expect(result.current[0]).toEqual([])
  })
})
