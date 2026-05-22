import { describe, it, expect, vi, afterEach } from 'vitest'
import { isMacOs } from '@/lib/isMacOs'

describe('isMacOs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('userAgentData.platform (modern API)', () => {
    it('returns true when userAgentData.platform reports macOS', () => {
      vi.stubGlobal('navigator', {
        userAgentData: { platform: 'macOS' },
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (irrelevant)'
      })
      expect(isMacOs()).toBe(true)
    })

    it('returns false when userAgentData.platform reports Windows even if userAgent contains "Mac"', () => {
      vi.stubGlobal('navigator', {
        userAgentData: { platform: 'Windows' },
        platform: 'MacIntel',
        userAgent: 'Macintosh; misleading'
      })
      expect(isMacOs()).toBe(false)
    })
  })

  describe('navigator.platform fallback', () => {
    it('returns true when navigator.platform is MacIntel and userAgentData is absent', () => {
      vi.stubGlobal('navigator', {
        platform: 'MacIntel',
        userAgent: 'irrelevant'
      })
      expect(isMacOs()).toBe(true)
    })

    it('returns false when navigator.platform is Win32', () => {
      vi.stubGlobal('navigator', {
        platform: 'Win32',
        userAgent: 'irrelevant'
      })
      expect(isMacOs()).toBe(false)
    })

    it('returns false when navigator.platform is Linux', () => {
      vi.stubGlobal('navigator', {
        platform: 'Linux x86_64',
        userAgent: 'irrelevant'
      })
      expect(isMacOs()).toBe(false)
    })
  })

  describe('userAgent fallback', () => {
    it('returns true when only userAgent mentions Macintosh', () => {
      vi.stubGlobal('navigator', {
        platform: '',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      })
      expect(isMacOs()).toBe(true)
    })

    it('returns false when userAgent is a Windows UA', () => {
      vi.stubGlobal('navigator', {
        platform: '',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      })
      expect(isMacOs()).toBe(false)
    })
  })

  describe('navigator absent', () => {
    it('returns false when navigator is undefined', () => {
      vi.stubGlobal('navigator', undefined)
      expect(isMacOs()).toBe(false)
    })
  })
})
