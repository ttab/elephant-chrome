import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const { settingsClientMock, useSessionMock, useRegistryMock } = vi.hoisted(() => ({
  settingsClientMock: {
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
    updateDocument: vi.fn(),
    pollEventLog: vi.fn()
  },
  useSessionMock: vi.fn(),
  useRegistryMock: vi.fn()
}))

vi.mock('@ttab/elephant-api/user', () => ({
  SettingsClient: vi.fn(function SettingsClientCtor() {
    return settingsClientMock
  })
}))

vi.mock('@protobuf-ts/twirp-transport', () => ({
  TwirpFetchTransport: vi.fn(function TwirpFetchTransportCtor() {
    return {}
  })
}))

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: useRegistryMock
}))

vi.mock('@/shared/meta', () => ({
  meta: (token: string) => ({ meta: { authorization: `Bearer ${token}` } })
}))

import { SettingsProvider } from '@/modules/userSettings/SettingsProvider'
import { useSettings } from '@/modules/userSettings/useSettings'

const APPLICATION = 'com.example.tests'
const DOCUMENT_TYPE = 'ntb/nynorsk'

interface ProbeApi {
  deleteSettings: () => Promise<void>
  settings: unknown
}

const probeApi: { current: ProbeApi | null } = { current: null }

const Probe = (): null => {
  const { deleteSettings, settings } = useSettings(DOCUMENT_TYPE)
  probeApi.current = { deleteSettings, settings }
  return null
}

function renderProvider(): ReturnType<typeof render> {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsProvider application={APPLICATION}>{children}</SettingsProvider>
  )
  return render(<Probe />, { wrapper })
}

describe('SettingsProvider.deleteSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useSessionMock.mockReturnValue({ data: { accessToken: 'tok-123' } })
    useRegistryMock.mockReturnValue({
      server: { userUrl: 'https://user.example.invalid/' }
    })

    // Default: getDocument and pollEventLog idle. Tests can override per-case.
    settingsClientMock.getDocument.mockResolvedValue({ response: { document: { payload: undefined } } })
    // Keep the poll loop quiet by leaving this promise pending.
    settingsClientMock.pollEventLog.mockImplementation(() => new Promise(() => {}))
    settingsClientMock.deleteDocument.mockResolvedValue({ response: {} })

    probeApi.current = null
  })

  it('calls SettingsClient.deleteDocument with the right document descriptor and auth meta', async () => {
    renderProvider()
    await waitFor(() => {
      expect(probeApi.current).not.toBeNull()
    })

    await act(async () => {
      await probeApi.current!.deleteSettings()
    })

    expect(settingsClientMock.deleteDocument).toHaveBeenCalledTimes(1)
    const [request, options] = settingsClientMock.deleteDocument.mock.calls[0] as [
      { owner: string, application: string, type: string, key: string },
      { meta: { authorization: string } }
    ]
    expect(request).toEqual({
      owner: '',
      application: APPLICATION,
      type: DOCUMENT_TYPE,
      key: 'current'
    })
    expect(options.meta.authorization).toBe('Bearer tok-123')
  })

  it('clears local state and notifies subscribers after a successful delete', async () => {
    settingsClientMock.getDocument.mockResolvedValue({
      response: {
        document: {
          payload: { meta: [{ type: DOCUMENT_TYPE, data: { rule_string: 'foo' } }] }
        }
      }
    })

    renderProvider()
    await waitFor(() => {
      expect(probeApi.current?.settings).toEqual({
        meta: [{ type: DOCUMENT_TYPE, data: { rule_string: 'foo' } }]
      })
    })

    await act(async () => {
      await probeApi.current!.deleteSettings()
    })

    expect(probeApi.current?.settings).toBeUndefined()
  })

  it('treats a not_found error as success (idempotent delete)', async () => {
    const notFound = Object.assign(new Error('not_found'), { code: 'not_found' })
    settingsClientMock.deleteDocument.mockRejectedValueOnce(notFound)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderProvider()
    await waitFor(() => {
      expect(probeApi.current).not.toBeNull()
    })

    await act(async () => {
      await expect(probeApi.current!.deleteSettings()).resolves.toBeUndefined()
    })

    expect(probeApi.current?.settings).toBeUndefined()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('propagates non-404 errors and leaves state unchanged', async () => {
    settingsClientMock.getDocument.mockResolvedValue({
      response: {
        document: {
          payload: { meta: [{ type: DOCUMENT_TYPE, data: { rule_string: 'foo' } }] }
        }
      }
    })

    const boom = Object.assign(new Error('boom'), { code: 'internal' })
    settingsClientMock.deleteDocument.mockRejectedValueOnce(boom)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderProvider()
    await waitFor(() => {
      expect(probeApi.current?.settings).toEqual({
        meta: [{ type: DOCUMENT_TYPE, data: { rule_string: 'foo' } }]
      })
    })

    await act(async () => {
      await expect(probeApi.current!.deleteSettings()).rejects.toBe(boom)
    })

    expect(probeApi.current?.settings).toEqual({
      meta: [{ type: DOCUMENT_TYPE, data: { rule_string: 'foo' } }]
    })
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })
})
