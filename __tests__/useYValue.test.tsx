import { renderHook } from '@testing-library/react'
import { type CollaborationWrapper, initializeCollaborationWrapper } from './utils/initializeCollaborationWrapper'
import { act } from '../setupTests'
import { Block } from '@ttab/elephant-api/newsdoc'
import * as Y from 'yjs'
import { useYValue } from '@/modules/yjs/hooks/useYValue'

let init: CollaborationWrapper
let ydoc: Y.Map<unknown>

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
    ydoc = init.provider.document.getMap('ele')
  })

  afterAll(async () => {
    await init.server.server?.destroy()
    init.provider.destroy()
  })

  it('gets a simple value', () => {
    const { result } = renderHook(() =>
      useYValue<string>(ydoc, 'meta.core/assignment[0].title'), { wrapper: init.wrapper })
    expect(result.current[0]).toBe('Kortare text utsänd. Uppdateras')
  })

  it('sets a simple value', () => {
    const { result } = renderHook(() =>
      useYValue<string>(ydoc, 'meta.core/assignment[0].title'), { wrapper: init.wrapper })
    act(() => result.current[1]('Kortare text utbytt. Uppdaterats'))
    expect(result.current[0]).toBe('Kortare text utbytt. Uppdaterats')
  })

  it('gets an object from an array, SPT', () => {
    const { result } = renderHook(() =>
      useYValue<Block>(ydoc, 'links.core/section[0]'), { wrapper: init.wrapper })

    expect(result.current[0]).toEqual({
      ...sportsPayload,
      content: {},
      links: {},
      meta: {}
    })
  })

  it('replaces an object in an array, from SPT to KLT', () => {
    const { result } = renderHook(() =>
      useYValue<Block>(ydoc, 'links.core/section[0]'), { wrapper: init.wrapper })

    act(() => result.current[1](culturePayload))
    expect(result.current[0]).toEqual(culturePayload)

    act(() => result.current[1](sportsPayload))
  })

  it('appends and removes an object to an array', () => {
    const { result } = renderHook(() =>
      useYValue<Block[] | undefined>(ydoc, 'links.core/section'), { wrapper: init.wrapper })

    const initialSections = [...(result.current[0] ?? [])]
    expect(initialSections).toHaveLength(1)

    // Append
    act(() => result.current[1]([...(result.current[0] ?? []), sportsPayload]))
    expect(result.current[0]).toHaveLength(2)

    // Remove
    act(() => result.current[1](initialSections))
    expect(result.current[0]).toHaveLength(1)
  })

  it('updates when map entries are removed', () => {
    const doc = new Y.Doc()
    const container = doc.getMap('open-documents')
    const assignmentMap = new Y.Map<unknown>()
    const usersMap = new Y.Map<unknown>()

    const user = new Y.Map<unknown>()
    user.set('id', 'user-1')
    user.set('name', 'Test User')
    user.set('username', 'test-user')

    doc.transact(() => {
      usersMap.set('user-1', user)
      assignmentMap.set('users', usersMap)
      container.set('assignment-1', assignmentMap)
    })

    const { result } = renderHook(() =>
      useYValue<Record<string, { id: string }>>(container, 'assignment-1.users'), { wrapper: init.wrapper })

    expect(result.current[0]).toMatchObject({
      'user-1': {
        id: 'user-1'
      }
    })

    act(() => {
      doc.transact(() => {
        usersMap.delete('user-1')
      })
    })

    expect(result.current[0]).toEqual({})

    doc.destroy()
  })

  it('modifies existing slugline', () => {
    const { result } = renderHook(() =>
      useYValue<string | undefined>(ydoc, 'meta.core/assignment[0].meta.tt/slugline[0].value'), { wrapper: init.wrapper })

    expect(result.current[0]).toBe('lands-tomasson')
    act(() => result.current[1]('test'))
    expect(result.current[0]).toEqual('test')
  })

  it('creates non-existing slugline', () => {
    const { result } = renderHook(() =>
      useYValue<string | undefined>(ydoc, 'meta.core/assignment[1].meta.tt/slugline[0].value'), { wrapper: init.wrapper })

    expect(result.current[0]).toBe('')
    act(() => result.current[1]('test'))
    expect(result.current[0]).toEqual('test')
  })

  it('returns and preserves raw Y.XmlText', () => {
    const { result } = renderHook(() =>
      useYValue<Y.XmlText>(ydoc, 'root.title', true), { wrapper: init.wrapper })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalValue = result.current[0]?.toString()
    expect(result.current[0]).toBeInstanceOf(Y.XmlText)
    expect(originalValue).toBeTruthy()

    act(() => {
      result.current[0]?.insert(0, 'Updated: ')
    })

    expect(result.current[0]?.toString()).toBe(`Updated: ${originalValue}`)

    act(() => {
      const rawText = result.current[0]
      rawText?.delete(0, 'Updated: '.length)
    })

    expect(result.current[0]?.toString()).toBe(originalValue)
  })

  it('recomputes when array mutations shift nested paths', () => {
    const { result } = renderHook(() => {
      return {
        sectionTitle: useYValue<string | undefined>(ydoc, 'links.core/section[0].title'),
        sections: useYValue<Block[] | undefined>(ydoc, 'links.core/section')
      }
    }, { wrapper: init.wrapper })

    const originalSections = [...(result.current.sections[0] ?? [])]
    expect(result.current.sectionTitle[0]).toBe('Sport')

    act(() => {
      result.current.sections[1]([culturePayload, ...(result.current.sections[0] ?? [])])
    })

    expect(result.current.sectionTitle[0]).toBe('Kultur och nöje')

    act(() => {
      result.current.sections[1](originalSections)
    })

    expect(result.current.sectionTitle[0]).toBe('Sport')
  })

  it('recovers after replacing the observed tree', () => {
    const { result } = renderHook(() => {
      return {
        assignmentTitle: useYValue<string>(ydoc, 'meta.core/assignment[0].title'),
        assignments: useYValue<Block[] | undefined>(ydoc, 'meta.core/assignment')
      }
    }, { wrapper: init.wrapper })

    const originalAssignments = [...(result.current.assignments[0] ?? [])]
    const originalTitle = originalAssignments[0]?.title

    const replacementAssignments = originalAssignments.map((assignment, index) => {
      if (index === 0) {
        return {
          ...assignment,
          title: 'Replaced assignment title'
        }
      }
      return assignment
    })

    expect(result.current.assignmentTitle[0]).toBe(originalTitle)

    act(() => {
      result.current.assignments[1](replacementAssignments)
    })

    expect(result.current.assignmentTitle[0]).toBe('Replaced assignment title')

    act(() => {
      result.current.assignments[1](originalAssignments)
    })

    expect(result.current.assignmentTitle[0]).toBe(originalTitle)
  })

  it('gracefully handles missing containers', () => {
    const { result } = renderHook(() =>
      useYValue<string>(undefined, 'meta.core/assignment[0].title'))

    expect(result.current[0]).toBeUndefined()

    act(() => {
      result.current[1]('should not throw')
    })

    expect(result.current[0]).toBeUndefined()
  })
})
