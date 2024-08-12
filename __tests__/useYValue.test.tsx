import { renderHook } from '@testing-library/react'
import { useYValue } from '@/hooks/useYValue'
import { type CollaborationWrapper, initializeCollaborationWrapper } from './utils/initializeCollaborationWrapper'
import { act } from '../setupTests'
import { PlanningSections } from '@/defaults'
import { type Block } from '@/protos/service'

let init: CollaborationWrapper

describe('useYValue', () => {
  beforeAll(async () => {
    init = await initializeCollaborationWrapper()
  })

  afterAll(async () => {
    await init.server.destroy()
    init.provider.destroy()
  })

  it('gets a simple value', async () => {
    const { result } = renderHook(() =>
      useYValue<string>('meta.core/assignment[0].title'), { wrapper: init.wrapper })
    expect(result.current[0]).toBe('Kortare text utsänd. Uppdateras')
  })

  it('sets a simple value', async () => {
    const { result } = renderHook(() =>
      useYValue<string>('meta.core/assignment[0].title'), { wrapper: init.wrapper })
    act(() => result.current[1]('Kortare text utbytt. Uppdaterats'))
    expect(result.current[0]).toBe('Kortare text utbytt. Uppdaterats')
  })

  it('gets an object from an array, SPT', async () => {
    const { result } = renderHook(() =>
      useYValue<Block>('links.tt/sector[0]'), { wrapper: init.wrapper })

    expect(result.current[0]).toEqual({
      ...PlanningSections[2].payload,
      content: {},
      links: {},
      meta: {}
    })
  })


  it('replaces an object in an array, from SPT to KLT', async () => {
    const { result } = renderHook(() =>
      useYValue<Block>('links.tt/sector[0]'), { wrapper: init.wrapper })

    const payload = PlanningSections[3].payload
    if (payload) {
      act(() => result.current[1](payload))
      expect(result.current[0]).toEqual(payload)
    } else {
      throw new Error('Payload not found')
    }
  })

  it('appends an object to an array', async () => {
    const { result } = renderHook(() =>
      useYValue<Block>('links.tt/sector[1]'), { wrapper: init.wrapper })

    const payload = PlanningSections[3].payload
    if (payload) {
      act(() => result.current[1](payload))
      expect(result.current[2]).toHaveLength(2)
    } else {
      throw new Error('Payload not found')
    }
  })

  it('removes an object from an array', async () => {
    const { result } = renderHook(() =>
      useYValue<Block | undefined>('links.tt/sector[1]'), { wrapper: init.wrapper })

    expect(result.current[0]).toBeTruthy()
    act(() => result.current[1](undefined))
    expect(result.current[0]).toBeFalsy()
  })

  it('removes parent when last value is removed', async () => {
    const { result } = renderHook(() =>
      useYValue<Block | undefined>('links.tt/sector[0]'), { wrapper: init.wrapper })

    act(() => result.current[1](undefined))
    expect(result.current[0]).toBeFalsy()


    const { result: after } = renderHook(() =>
      useYValue<Block | undefined>('links.tt/sector'), { wrapper: init.wrapper })

    expect(after.current[0]).toBeUndefined()
  })
})
