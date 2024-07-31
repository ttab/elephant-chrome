import { renderHook } from '@testing-library/react'
import { useYValue } from '@/hooks/useYValue'
import { initializeCollaborationWrapper } from './utils/initializeCollaborationWrapper'
import { act } from '../setupTests'

describe('useYValue', () => {
  it('should return a simple value', async () => {
    const wrapper = await initializeCollaborationWrapper()

    const { result } = renderHook(() =>
      useYValue<string>('meta.core/assignment[0].title'), { wrapper })
    expect(result.current[0]).toBe('Kortare text utsänd. Uppdateras')
  })

  it('should set a simple value', async () => {
    const wrapper = await initializeCollaborationWrapper()
    const { result } = renderHook(() =>
      useYValue<string>('meta.core/assignment[0].title'), { wrapper })
    act(() => result.current[1]('Kortare text utbytt. Uppdaterats'))
    expect(result.current[0]).toBe('Kortare text utbytt. Uppdaterats')
  })
})
