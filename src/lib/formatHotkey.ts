import { isMacOs } from '@/lib/isMacOs'

const SHARED: Record<string, string> = {
  up: '↑',
  down: '↓',
  right: '→',
  left: '←'
}

const MAC: Record<string, string> = {
  mod: '⌘',
  shift: '⇧',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  opt: '⌥',
  option: '⌥'
}

const PC: Record<string, string> = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  opt: 'Alt',
  option: 'Alt'
}

export function formatHotkey(hotkey: string | undefined, isMac = isMacOs()): string {
  if (!hotkey) return ''
  const tokens = hotkey.split('+').map((token) => formatToken(token, isMac))
  return tokens.join(isMac ? '' : '+')
}

function formatToken(token: string, isMac: boolean): string {
  const t = token.toLowerCase()
  const mapped = (isMac ? MAC : PC)[t] ?? SHARED[t]
  if (mapped) return mapped
  return token.length === 1 ? token.toUpperCase() : token
}
