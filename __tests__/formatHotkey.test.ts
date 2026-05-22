import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatHotkey } from '@/lib/formatHotkey'

describe('formatHotkey', () => {
  describe('on Mac', () => {
    const isMac = true

    it('renders modifier glyphs joined without separator', () => {
      expect(formatHotkey('mod+option+1', isMac)).toBe('⌘⌥1')
    })

    it('maps mod to command glyph', () => {
      expect(formatHotkey('mod+b', isMac)).toBe('⌘B')
    })

    it('maps option/alt to option glyph', () => {
      expect(formatHotkey('mod+option+1', isMac)).toBe('⌘⌥1')
      expect(formatHotkey('mod+alt+1', isMac)).toBe('⌘⌥1')
    })

    it('maps shift and ctrl to their glyphs', () => {
      expect(formatHotkey('shift+ctrl+a', isMac)).toBe('⇧⌃A')
    })

    it('maps arrow keys to arrow glyphs', () => {
      expect(formatHotkey('mod+option+up', isMac)).toBe('⌘⌥↑')
      expect(formatHotkey('mod+option+down', isMac)).toBe('⌘⌥↓')
    })
  })

  describe('on non-Mac (Windows/Linux/Chromebook)', () => {
    const isMac = false

    it('renders modifier names joined by plus signs', () => {
      expect(formatHotkey('mod+option+1', isMac)).toBe('Ctrl+Alt+1')
    })

    it('maps mod and ctrl to "Ctrl"', () => {
      expect(formatHotkey('mod+b', isMac)).toBe('Ctrl+B')
      expect(formatHotkey('ctrl+b', isMac)).toBe('Ctrl+B')
    })

    it('maps option/alt to "Alt"', () => {
      expect(formatHotkey('mod+option+1', isMac)).toBe('Ctrl+Alt+1')
      expect(formatHotkey('mod+alt+1', isMac)).toBe('Ctrl+Alt+1')
    })

    it('uppercases letter keys', () => {
      expect(formatHotkey('mod+i', isMac)).toBe('Ctrl+I')
      expect(formatHotkey('mod+u', isMac)).toBe('Ctrl+U')
    })

    it('passes digits through unchanged', () => {
      expect(formatHotkey('mod+option+0', isMac)).toBe('Ctrl+Alt+0')
      expect(formatHotkey('mod+option+3', isMac)).toBe('Ctrl+Alt+3')
    })

    it('maps arrow keys to arrow glyphs', () => {
      expect(formatHotkey('mod+option+up', isMac)).toBe('Ctrl+Alt+↑')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for undefined', () => {
      expect(formatHotkey(undefined, false)).toBe('')
      expect(formatHotkey(undefined, true)).toBe('')
    })

    it('returns empty string for empty input', () => {
      expect(formatHotkey('', false)).toBe('')
      expect(formatHotkey('', true)).toBe('')
    })

    it('handles a single key without modifiers', () => {
      expect(formatHotkey('b', false)).toBe('B')
      expect(formatHotkey('b', true)).toBe('B')
    })

    it('is case-insensitive on input tokens', () => {
      expect(formatHotkey('MOD+OPTION+1', false)).toBe('Ctrl+Alt+1')
      expect(formatHotkey('MOD+OPTION+1', true)).toBe('⌘⌥1')
    })
  })

  describe('default isMac argument (uses isMacOs)', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('renders Mac glyphs when the current platform is detected as Mac', () => {
      vi.stubGlobal('navigator', { platform: 'MacIntel' })
      expect(formatHotkey('mod+option+1')).toBe('⌘⌥1')
    })

    it('renders Ctrl+Alt+... when the current platform is not Mac', () => {
      vi.stubGlobal('navigator', { platform: 'Win32' })
      expect(formatHotkey('mod+option+1')).toBe('Ctrl+Alt+1')
    })
  })
})
