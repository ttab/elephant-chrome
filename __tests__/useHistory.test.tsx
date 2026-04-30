import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useHistory } from '@/navigation/hooks/useHistory'

describe('useHistory', () => {
  it('does not resubscribe to popstate on every re-render', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const popstateAdds = (): number =>
      addSpy.mock.calls.filter((call) => call[0] === 'popstate').length
    const popstateRemoves = (): number =>
      removeSpy.mock.calls.filter((call) => call[0] === 'popstate').length

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

    addSpy.mockRestore()
    removeSpy.mockRestore()
    unmount()
  })
})
