import { useState } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import { render, act } from '@testing-library/react'
import { useHistory } from '@/navigation/hooks/useHistory'

describe('useHistory', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let addSpy: MockInstance<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let removeSpy: MockInstance<any>

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener')
    removeSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  const popstateAdds = () =>
    (addSpy.mock.calls as [string, ...unknown[]][])
      .filter(([type]) => type === 'popstate').length
  const popstateRemoves = () =>
    (removeSpy.mock.calls as [string, ...unknown[]][])
      .filter(([type]) => type === 'popstate').length

  it('does not resubscribe to popstate on every re-render', () => {
    const Probe = () => {
      const [, setN] = useState(0)
      useHistory()
      ;(Probe as unknown as { force: () => void }).force = () => setN((n) => n + 1)
      return null
    }

    const { unmount } = render(<Probe />)
    const addsAfterMount = popstateAdds()
    const removesAfterMount = popstateRemoves()

    for (let i = 0; i < 10; i++) {
      act(() => {
        ;(Probe as unknown as { force: () => void }).force()
      })
    }

    expect(popstateAdds() - addsAfterMount).toBe(0)
    expect(popstateRemoves() - removesAfterMount).toBe(0)

    unmount()
  })
})
