import { waitFor } from '@testing-library/react'
import { RepositorySocket } from '@/shared/RepositorySocket'
import { Response as ResponseType, type DocumentState } from '@ttab/elephant-api/repositorysocket'
import { Document } from '@ttab/elephant-api/newsdoc'
import type { Repository } from '@/shared/Repository'
import { findDeliverableParentIndex } from '@/hooks/useRepositorySocket/lib/handlers'

type CloseEventLike = { wasClean: boolean, code?: number, reason?: string }

class MockWebSocket {
  static instances: MockWebSocket[] = []

  static OPEN = 1
  static CLOSED = 3

  readonly url: string
  binaryType: string = 'blob'
  readyState = 0

  onopen: (() => void) | null = null
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onclose: ((event: CloseEventLike) => void) | null = null

  send = vi.fn<(data: unknown) => void>()
  close = vi.fn<() => void>(() => {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ wasClean: true, code: 1000, reason: '' })
  })

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  message(data: ArrayBuffer): void {
    this.onmessage?.({ data })
  }

  serverClose(event: CloseEventLike): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(event)
  }
}

const toArrayBuffer = (response: Parameters<typeof ResponseType.toBinary>[0]): ArrayBuffer => {
  const bytes = ResponseType.toBinary(response)
  const slice = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

  // Ensure we return an ArrayBuffer, not SharedArrayBuffer
  return slice instanceof ArrayBuffer ? slice : new ArrayBuffer(slice.byteLength)
}

const newSocket = () => {
  const repository = {
    getSocketToken: vi.fn().mockResolvedValue('socket-token')
  } as unknown as Repository

  return {
    repository,
    socket: new RepositorySocket('wss://example.test/ws', repository)
  }
}

describe('RepositorySocket', () => {
  const OriginalWebSocket = globalThis.WebSocket

  beforeEach(() => {
    MockWebSocket.instances = []
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
  })

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket
    vi.restoreAllMocks()
  })

  it('connects using a socket token and marks the socket connected on open', async () => {
    const { socket, repository } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))

    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    expect(repository.getSocketToken).toHaveBeenCalledTimes(1)
    expect(MockWebSocket.instances).toHaveLength(1)

    const ws = MockWebSocket.instances[0]
    expect(ws.url).toBe('wss://example.test/ws/socket-token')
    expect(ws.binaryType).toBe('arraybuffer')

    ws.open()
    await connectPromise

    expect(socket.isConnected).toBe(true)
    expect(socket.isAuthenticated).toBe(false)
  })

  it('authenticates and resolves when a successful response is received', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('auth-call')

    const authPromise = socket.authenticate()

    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'auth-call',
          handled: true
        })
      )
    )

    await authPromise
    expect(socket.isAuthenticated).toBe(true)
  })

  it('rejects authentication when response contains an error message', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('auth-call')

    const authPromise = socket.authenticate()

    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'auth-call',
          handled: false,
          error: { errorCode: 'unauthenticated', errorMessage: 'bad token' }
        })
      )
    )

    await expect(authPromise).rejects.toThrow('bad token')
    expect(socket.isAuthenticated).toBe(false)
  })

  it('getDocuments aggregates batches and forwards updates matching callId', async () => {
    const { socket } = newSocket()

    // connect + authenticate
    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('docs-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const docsPromise = socket.getDocuments({ setName: 'set-a', type: 'tt/article' })
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    const doc1 = { meta: undefined, document: undefined }
    const doc2 = { meta: undefined, document: undefined }

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: false,
          documentBatch: { setName: 'set-a', documents: [doc1], finalBatch: false }
        })
      )
    )

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: true,
          documentBatch: { setName: 'set-a', documents: [doc2], finalBatch: true }
        })
      )
    )

    const { callId, documents, onUpdate } = await docsPromise

    expect(callId).toBe('docs-call')
    expect(documents).toEqual([doc1, doc2])

    const updateHandler = vi.fn()
    const unsubscribe = onUpdate(updateHandler)

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: false,
          documentUpdate: { setName: 'set-a', included: false }
        })
      )
    )

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'other-call',
          handled: false,
          documentUpdate: { setName: 'set-a', included: false }
        })
      )
    )

    expect(updateHandler).toHaveBeenCalledTimes(1)

    unsubscribe()

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: false,
          removed: { setName: 'set-a', documentUuid: 'uuid-1' }
        })
      )
    )

    expect(updateHandler).toHaveBeenCalledTimes(1)
  })

  it('getDocuments throws when not authenticated', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    // Not authenticated — should throw immediately
    await expect(
      socket.getDocuments({ setName: 'set-a', type: 'tt/article' })
    ).rejects.toThrow('Not authenticated')
  })

  it('getDocuments rejects when response contains errorMessage', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('docs-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const docsPromise = socket.getDocuments({ setName: 'set-a', type: 'tt/article' })
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          error: { errorCode: 'internal', errorMessage: 'server exploded' }
        })
      )
    )

    await expect(docsPromise).rejects.toThrow('server exploded')
  })

  it('getDocuments rejects with generic message when response has error without message', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('docs-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const docsPromise = socket.getDocuments({ setName: 'set-a', type: 'tt/article' })
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          error: { errorCode: 'internal' }
        })
      )
    )

    await expect(docsPromise).rejects.toThrow('Failed to get documents')
  })

  it('getDocuments attaches inclusionBatch documents to matching parents', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('docs-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const docsPromise = socket.getDocuments({
      setName: 'set-a',
      type: 'core/planning-item',
      include: ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}'],
      resolveParentIndex: findDeliverableParentIndex
    })
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    // Parent planning doc with assignment linking to deliverable
    const parentDoc: DocumentState = {
      document: Document.create({
        uuid: 'planning-1',
        type: 'core/planning-item',
        uri: 'core://planning/planning-1',
        meta: [
          {
            type: 'core/assignment',
            links: [
              { rel: 'deliverable', uuid: 'article-1' }
            ]
          }
        ]
      })
    }

    // Another parent with no assignment links
    const parentDocNoLinks: DocumentState = {
      document: Document.create({
        uuid: 'planning-2',
        type: 'core/planning-item',
        uri: 'core://planning/planning-2'
      })
    }

    // Send document batch
    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: false,
          documentBatch: { setName: 'set-a', documents: [parentDoc, parentDocNoLinks], finalBatch: true }
        })
      )
    )

    // Send inclusion batch with a matching deliverable and an orphan
    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: true,
          inclusionBatch: {
            setName: 'set-a',
            documents: [
              {
                uuid: 'article-1',
                state: {
                  document: Document.create({
                    uuid: 'article-1',
                    type: 'core/article',
                    uri: 'core://article/article-1',
                    title: 'Deliverable Article'
                  })
                }
              },
              {
                uuid: 'orphan-1',
                state: {
                  document: Document.create({
                    uuid: 'orphan-1',
                    type: 'core/article',
                    uri: 'core://article/orphan-1'
                  })
                }
              }
            ]
          }
        })
      )
    )

    const { documents } = await docsPromise

    expect(documents).toHaveLength(2)

    // First parent should have the matching deliverable attached
    expect(documents[0].includedDocuments).toHaveLength(1)
    expect(documents[0].includedDocuments![0].state?.document?.uuid).toBe('article-1')
    expect(documents[0].includedDocuments![0].state?.document?.title).toBe('Deliverable Article')

    // Second parent should have no included documents (no assignment links)
    expect(documents[1].includedDocuments).toBeUndefined()
  })

  it('getDocuments handles inclusionBatch with no matching parents', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('docs-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const docsPromise = socket.getDocuments({
      setName: 'set-a',
      type: 'core/planning-item',
      resolveParentIndex: findDeliverableParentIndex
    })
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    // Parent with no assignment meta
    const parentDoc: DocumentState = {
      document: Document.create({
        uuid: 'planning-1',
        type: 'core/planning-item',
        uri: 'core://planning/planning-1'
      })
    }

    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: false,
          documentBatch: { setName: 'set-a', documents: [parentDoc], finalBatch: true }
        })
      )
    )

    // Inclusion batch with no matching parent
    ws.message(
      toArrayBuffer(
        ResponseType.create({
          callId: 'docs-call',
          handled: true,
          inclusionBatch: {
            setName: 'set-a',
            documents: [
              {
                uuid: 'orphan-1',
                state: {
                  document: Document.create({
                    uuid: 'orphan-1',
                    type: 'core/article',
                    uri: 'core://article/orphan-1'
                  })
                }
              }
            ]
          }
        })
      )
    )

    const { documents } = await docsPromise

    expect(documents).toHaveLength(1)
    expect(documents[0].includedDocuments).toBeUndefined()
  })

  it('does not reconnect on clean close', async () => {
    vi.useFakeTimers()

    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await vi.advanceTimersByTimeAsync(0)
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    // Clean close — should NOT trigger reconnect
    ws.serverClose({ wasClean: true, code: 1000 })

    await vi.advanceTimersByTimeAsync(10000)

    // No new WebSocket instances should be created
    expect(MockWebSocket.instances).toHaveLength(1)

    vi.useRealTimers()
  })

  it('onError handler is called on WebSocket error', async () => {
    const { socket } = newSocket()

    const errorHandler = vi.fn()
    socket.onError(errorHandler)

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]

    ws.onerror?.(new Event('error'))

    await expect(connectPromise).rejects.toThrow('WebSocket connection error')
    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error))
    expect((errorHandler.mock.calls[0][0] as Error).message).toBe('WebSocket connection error')
  })

  it('reconnect handles failed re-authentication gracefully', async () => {
    vi.useFakeTimers()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { socket } = newSocket()

    // Connect and authenticate
    const connectPromise = socket.connect('access-token')
    await vi.advanceTimersByTimeAsync(0)
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('auth-call')
    const authPromise = socket.authenticate()
    await vi.advanceTimersByTimeAsync(0)
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    // Setup for reconnect: auth will fail
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('reauth-call')

    // Simulate unclean close
    ws.serverClose({ wasClean: false, code: 1006 })

    // Advance past reconnect delay
    await vi.advanceTimersByTimeAsync(5000)

    // New WebSocket created
    expect(MockWebSocket.instances).toHaveLength(2)
    const ws2 = MockWebSocket.instances[1]
    ws2.open()

    // Flush so connect resolves, authenticate starts
    await vi.advanceTimersByTimeAsync(0)

    // Send auth error
    ws2.message(toArrayBuffer(ResponseType.create({
      callId: 'reauth-call',
      error: { errorCode: 'unauthenticated', errorMessage: 'expired' }
    })))

    // Flush so error is caught
    await vi.advanceTimersByTimeAsync(0)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Reconnection failed:',
      expect.any(Error)
    )

    socket.disconnect()
    consoleErrorSpy.mockRestore()
    vi.useRealTimers()
  })

  it('closeDocumentSet is a no-op when not authenticated', async () => {
    const { socket } = newSocket()
    await expect(socket.closeDocumentSet('set-a')).resolves.toBeUndefined()
  })

  it('closeDocumentSet resolves on successful response when authenticated', async () => {
    const { socket } = newSocket()

    const connectPromise = socket.connect('access-token')
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('auth-call')
      .mockReturnValueOnce('close-call')

    const authPromise = socket.authenticate()
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(1))
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    const closePromise = socket.closeDocumentSet('set-a')
    await waitFor(() => expect(ws.send).toHaveBeenCalledTimes(2))

    ws.message(toArrayBuffer(ResponseType.create({ callId: 'close-call', handled: true })))

    await expect(closePromise).resolves.toBeUndefined()
  })

  it('calls onReconnect listeners after successful reconnect', async () => {
    vi.useFakeTimers()

    const { socket } = newSocket()

    // Connect (flush microtasks so getSocketToken resolves and WebSocket is created)
    const connectPromise = socket.connect('access-token')
    await vi.advanceTimersByTimeAsync(0)
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    // Authenticate (flush microtasks so getSession resolves and send is called)
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('auth-call')
    const authPromise = socket.authenticate()
    await vi.advanceTimersByTimeAsync(0)
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    // Register reconnect listener
    const spy = vi.fn()
    socket.onReconnect(spy)

    // Setup UUID mock for the reauth call during reconnect
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('reauth-call')

    // Simulate unclean close — triggers #reconnect() with exponential backoff
    ws.serverClose({ wasClean: false, code: 1006 })

    // Advance past the reconnect delay (also flushes microtasks for getSocketToken)
    await vi.advanceTimersByTimeAsync(5000)

    // A new WebSocket instance should be created
    expect(MockWebSocket.instances).toHaveLength(2)
    const ws2 = MockWebSocket.instances[1]
    ws2.open()

    // Flush microtasks so connect resolves and authenticate starts (getSession)
    await vi.advanceTimersByTimeAsync(0)
    expect(ws2.send).toHaveBeenCalledTimes(1)
    ws2.message(toArrayBuffer(ResponseType.create({ callId: 'reauth-call', handled: true })))

    // Flush so authenticate resolves and reconnect listeners fire
    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('does not call onReconnect listeners after explicit disconnect', async () => {
    vi.useFakeTimers()

    const { socket } = newSocket()

    // Connect
    const connectPromise = socket.connect('access-token')
    await vi.advanceTimersByTimeAsync(0)
    const ws = MockWebSocket.instances[0]
    ws.open()
    await connectPromise

    // Authenticate
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('auth-call')
    const authPromise = socket.authenticate()
    await vi.advanceTimersByTimeAsync(0)
    ws.message(toArrayBuffer(ResponseType.create({ callId: 'auth-call', handled: true })))
    await authPromise

    // Register reconnect listener
    const spy = vi.fn()
    socket.onReconnect(spy)

    // Explicit disconnect — clears listeners and prevents reconnect
    socket.disconnect()

    // Advance timers well past any potential reconnect delay
    await vi.advanceTimersByTimeAsync(10000)

    expect(spy).not.toHaveBeenCalled()
    // No new WebSocket instances should be created (only the original one)
    expect(MockWebSocket.instances).toHaveLength(1)

    vi.useRealTimers()
  })
})
