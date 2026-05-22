import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { useSettingsMock } = vi.hoisted(() => ({
  useSettingsMock: vi.fn()
}))

vi.mock('@/modules/userSettings', () => ({
  useSettings: useSettingsMock
}))

import { useUserPreferences } from '@/hooks/useUserPreferences'

const NYNORSK_DOCUMENT_TYPE = 'ntb/nynorsk'

interface MetaBlock {
  type: string
  data?: { rule_string?: string }
}

interface MockSettings {
  meta?: MetaBlock[]
}

function setUseSettings(opts: {
  settings?: MockSettings
  updateSettings?: ReturnType<typeof vi.fn>
  deleteSettings?: ReturnType<typeof vi.fn>
  isLoading?: boolean
}): { updateSettings: ReturnType<typeof vi.fn>, deleteSettings: ReturnType<typeof vi.fn> } {
  const updateSettings = opts.updateSettings ?? vi.fn().mockResolvedValue(undefined)
  const deleteSettings = opts.deleteSettings ?? vi.fn().mockResolvedValue(undefined)
  useSettingsMock.mockReturnValue({
    settings: opts.settings,
    isLoading: opts.isLoading ?? false,
    updateSettings,
    deleteSettings
  })
  return { updateSettings, deleteSettings }
}

describe('useUserPreferences', () => {
  beforeEach(() => {
    useSettingsMock.mockReset()
  })

  describe('preferences', () => {
    it('returns undefined nynorskPrefs when no settings exist', () => {
      setUseSettings({ settings: undefined })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBeUndefined()
    })

    it('returns undefined nynorskPrefs when meta is missing', () => {
      setUseSettings({ settings: {} })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBeUndefined()
    })

    it('returns the rule_string from the nynorsk meta block', () => {
      setUseSettings({
        settings: {
          meta: [{ type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'a,b,c' } }]
        }
      })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBe('a,b,c')
    })

    it('coerces an empty rule_string to undefined', () => {
      setUseSettings({
        settings: {
          meta: [{ type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: '' } }]
        }
      })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBeUndefined()
    })

    it('coerces a whitespace-only rule_string to undefined', () => {
      setUseSettings({
        settings: {
          meta: [{ type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: '   \n  ' } }]
        }
      })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBeUndefined()
    })

    it('ignores blocks of other types when reading nynorskPrefs', () => {
      setUseSettings({
        settings: {
          meta: [
            { type: 'other/setting', data: { rule_string: 'irrelevant' } },
            { type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'foo' } }
          ]
        }
      })
      const { result } = renderHook(() => useUserPreferences())
      expect(result.current.preferences.nynorskPrefs).toBe('foo')
    })
  })

  describe('updateNynorskPrefs', () => {
    it('saves a new document with the nynorsk block for non-empty prefs', async () => {
      const { updateSettings, deleteSettings } = setUseSettings({ settings: undefined })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('e_ending,split_inf')
      })

      expect(deleteSettings).not.toHaveBeenCalled()
      expect(updateSettings).toHaveBeenCalledTimes(1)
      const savedDoc = updateSettings.mock.calls[0][0] as { type: string, meta: MetaBlock[] }
      expect(savedDoc.type).toBe(NYNORSK_DOCUMENT_TYPE)
      expect(savedDoc.meta).toHaveLength(1)
      expect(savedDoc.meta[0].type).toBe(NYNORSK_DOCUMENT_TYPE)
      expect(savedDoc.meta[0].data?.rule_string).toBe('e_ending,split_inf')
    })

    it('preserves unrelated blocks when saving non-empty prefs', async () => {
      const otherBlock: MetaBlock = { type: 'other/setting', data: { rule_string: 'keep' } }
      const { updateSettings } = setUseSettings({
        settings: {
          meta: [
            otherBlock,
            { type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'old' } }
          ]
        }
      })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('new')
      })

      const savedDoc = updateSettings.mock.calls[0][0] as { meta: MetaBlock[] }
      expect(savedDoc.meta).toHaveLength(2)
      expect(savedDoc.meta[0].type).toBe('other/setting')
      expect(savedDoc.meta[0].data?.rule_string).toBe('keep')
      expect(savedDoc.meta[1].type).toBe(NYNORSK_DOCUMENT_TYPE)
      expect(savedDoc.meta[1].data?.rule_string).toBe('new')
    })

    it('deletes the document when clearing prefs and no other blocks exist', async () => {
      const { updateSettings, deleteSettings } = setUseSettings({
        settings: {
          meta: [{ type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'old' } }]
        }
      })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('')
      })

      expect(deleteSettings).toHaveBeenCalledTimes(1)
      expect(updateSettings).not.toHaveBeenCalled()
    })

    it('treats a whitespace-only string the same as empty (deletes when alone)', async () => {
      const { updateSettings, deleteSettings } = setUseSettings({
        settings: {
          meta: [{ type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'old' } }]
        }
      })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('   \n  ')
      })

      expect(deleteSettings).toHaveBeenCalledTimes(1)
      expect(updateSettings).not.toHaveBeenCalled()
    })

    it('preserves unrelated blocks when clearing prefs (updates instead of deletes)', async () => {
      const otherBlock: MetaBlock = { type: 'other/setting', data: { rule_string: 'keep' } }
      const { updateSettings, deleteSettings } = setUseSettings({
        settings: {
          meta: [
            otherBlock,
            { type: NYNORSK_DOCUMENT_TYPE, data: { rule_string: 'old' } }
          ]
        }
      })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('')
      })

      expect(deleteSettings).not.toHaveBeenCalled()
      expect(updateSettings).toHaveBeenCalledTimes(1)
      const savedDoc = updateSettings.mock.calls[0][0] as { meta: MetaBlock[] }
      expect(savedDoc.meta).toHaveLength(1)
      expect(savedDoc.meta[0].type).toBe('other/setting')
      expect(savedDoc.meta[0].data?.rule_string).toBe('keep')
    })

    it('deletes when settings document does not yet exist and prefs are empty', async () => {
      const { updateSettings, deleteSettings } = setUseSettings({ settings: undefined })
      const { result } = renderHook(() => useUserPreferences())

      await act(async () => {
        await result.current.updateNynorskPrefs('')
      })

      expect(deleteSettings).toHaveBeenCalledTimes(1)
      expect(updateSettings).not.toHaveBeenCalled()
    })
  })
})
