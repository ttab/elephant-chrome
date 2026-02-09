import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { RepositorySocket } from '@/shared/RepositorySocket'
import { Response as ResponseType } from '@ttab/elephant-api/repositorysocket'
import type { Repository } from '@/shared/Repository'

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
    // @ts-expect-error test override
    globalThis.WebSocket = MockWebSocket
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
})
