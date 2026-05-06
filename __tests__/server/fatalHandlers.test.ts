import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFatalHandler } from '../../src-srv/lib/fatalHandlers.js'

describe('createFatalHandler', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let abortSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => undefined) as never)
    abortSpy = vi.spyOn(process, 'abort').mockImplementation((() => undefined) as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('logs fatal, closes collaboration server, exits with 1 on success', async () => {
    const fatal = vi.fn()
    const close = vi.fn().mockResolvedValue(undefined)
    const handler = createFatalHandler('Uncaught exception', {
      collaborationServer: { close },
      logger: { fatal }
    })

    const ex = new Error('boom')
    handler(ex)

    await new Promise((resolve) => setImmediate(resolve))

    expect(fatal).toHaveBeenCalledWith({ err: ex }, 'Uncaught exception')
    expect(close).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(abortSpy).not.toHaveBeenCalled()
  })

  it('still exits with 1 when close rejects, logging the close failure', async () => {
    const fatal = vi.fn()
    const closeError = new Error('shutdown failed')
    const close = vi.fn().mockRejectedValue(closeError)
    const handler = createFatalHandler('Unhandled rejection', {
      collaborationServer: { close },
      logger: { fatal }
    })

    const ex = new Error('boom')
    handler(ex)

    await new Promise((resolve) => setImmediate(resolve))

    expect(fatal).toHaveBeenNthCalledWith(1, { err: ex }, 'Unhandled rejection')
    expect(fatal).toHaveBeenNthCalledWith(2, { err: closeError }, 'Failed to close collaboration server')
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(abortSpy).not.toHaveBeenCalled()
  })

  it('aborts when close hangs past the force-exit timeout', () => {
    vi.useFakeTimers()
    const fatal = vi.fn()
    const close = vi.fn(() => new Promise<void>(() => {}))
    const handler = createFatalHandler('Uncaught exception', {
      collaborationServer: { close },
      logger: { fatal },
      forceExitMs: 500
    })

    handler(new Error('boom'))

    expect(abortSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(500)
    expect(abortSpy).toHaveBeenCalledOnce()
  })

  it('clears the force-exit timer when close resolves before timeout', async () => {
    vi.useFakeTimers()
    const fatal = vi.fn()
    let resolveClose: () => void = () => {}
    const close = vi.fn(() => new Promise<void>((resolve) => {
      resolveClose = resolve
    }))
    const handler = createFatalHandler('Uncaught exception', {
      collaborationServer: { close },
      logger: { fatal },
      forceExitMs: 1000
    })

    handler(new Error('boom'))
    resolveClose()

    await vi.runAllTimersAsync()

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(abortSpy).not.toHaveBeenCalled()
  })
})
