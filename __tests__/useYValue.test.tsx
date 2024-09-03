import { renderHook } from '@testing-library/react'
import { useYValue } from '@/hooks/useYValue'
import { type CollaborationWrapper, initializeCollaborationWrapper } from './utils/initializeCollaborationWrapper'
import { act } from '../setupTests'
import { Block } from '@/protos/service'

let init: CollaborationWrapper

const culturePayload = Block.create({
  uuid: '1c0df6b4-d82e-5ae6-aaee-47e33c04ba5b',
  type: 'core/section',
  title: 'Kultur och nöje',
  rel: 'section'
})

const sportsPayload = Block.create({
  uuid: 'a36ff853-9fb3-5950-8893-64ac699f5481',
  type: 'core/section',
  title: 'Sport',
  rel: 'section'
})

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
      useYValue<Block>('links.core/section[0]'), { wrapper: init.wrapper })

    expect(result.current[0]).toEqual({
      ...sportsPayload,
      content: {},
      links: {},
      meta: {}
    })
  })


  it('replaces an object in an array, from SPT to KLT', async () => {
    const { result } = renderHook(() =>
      useYValue<Block>('links.core/section[0]'), { wrapper: init.wrapper })

    act(() => result.current[1](culturePayload))
    expect(result.current[0]).toEqual(culturePayload)
  })

  it('appends and removes an object to an array', async () => {
    const { result } = renderHook(() =>
      useYValue<Block | undefined>('links.core/section[1]'), { wrapper: init.wrapper })

    // Append
    act(() => result.current[1](sportsPayload))
    expect(result.current[2]).toHaveLength(2)

    // Remove
    act(() => result.current[1](undefined))
    expect(result.current[2]).toHaveLength(1)
  })

  it('add path to value if non existent', async () => {
    const { result } = renderHook(() =>
      useYValue<Block | undefined>('links.core/story[0]'), { wrapper: init.wrapper })

    const { result: parent } = renderHook(() =>
      useYValue<Block | undefined>('links.core/story'), { wrapper: init.wrapper })

    // Value is still undefined
    expect(result.current[0]).toBeUndefined()
    // But path to parent has been created
    expect(parent.current[0]).toEqual([])
  })

  it('modifies existing slugline', async () => {
    const { result } = renderHook(() =>
      useYValue<string | undefined>('meta.core/assignment[0].meta.tt/slugline[0].value'), { wrapper: init.wrapper })

    expect(result.current[0]).toBe('lands-tomasson')
    act(() => result.current[1]('test'))
    expect(result.current[0]).toEqual('test')
  })

  it('creates non-existing slugline', async () => {
    const { result } = renderHook(() =>
      useYValue<string | undefined>('meta.core/assignment[1].meta.tt/slugline[0].value'), { wrapper: init.wrapper })

    expect(result.current[0]).toBe('')
    act(() => result.current[1]('test'))
    expect(result.current[0]).toEqual('test')
  })

  it('handles __inProgress', async () => {
    const { result } = renderHook(() =>
      useYValue<boolean | undefined>('meta.core/assignment[0].__inProgress'), { wrapper: init.wrapper })

    expect(result.current[0]).toBeFalsy()
    act(() => result.current[1](true))
    expect(result.current[0]).toBeTruthy()
  })
})
