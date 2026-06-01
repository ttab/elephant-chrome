import type { TBElement } from '@ttab/textbit'
import { translate } from '@/shared/translate'

interface TextNode {
  text: string
  [key: string]: unknown
}

function isTextNode(node: unknown): node is TextNode {
  return typeof node === 'object' && node !== null && 'text' in node && typeof (node as TextNode).text === 'string'
}

/**
 * Extract all non-empty text strings from a TBElement tree, preserving order.
 */
function collectTexts(elements: TBElement[]): string[] {
  const texts: string[] = []

  function walk(node: unknown): void {
    if (isTextNode(node)) {
      if (node.text.trim() !== '') {
        texts.push(node.text)
      }
    } else if (typeof node === 'object' && node !== null && 'children' in node) {
      const children = (node as { children: unknown[] }).children
      if (Array.isArray(children)) {
        children.forEach(walk)
      }
    }
  }

  elements.forEach(walk)
  return texts
}

/**
 * Replace non-empty text strings in a TBElement tree with translated texts, in order.
 */
function replaceTexts(elements: TBElement[], translated: string[]): void {
  let index = 0

  function walk(node: unknown): void {
    if (isTextNode(node)) {
      if (node.text.trim() !== '') {
        node.text = translated[index++]
      }
    } else if (typeof node === 'object' && node !== null && 'children' in node) {
      const children = (node as { children: unknown[] }).children
      if (Array.isArray(children)) {
        children.forEach(walk)
      }
    }
  }

  elements.forEach(walk)
}

type PrefValue = { enabled: boolean } | { words: { values: string[] } }

/**
 * Convert the comma-separated personal prefs string to the map format
 * expected by the Nynorsk API. Two entry shapes are supported:
 *   `rule_key`            -> { enabled: true }
 *   `rule_key=w1:w2:w3`   -> { words: { values: ['w1', 'w2', 'w3'] } }
 */
function parsePersonalPrefs(prefsString: string): Record<string, PrefValue> {
  const prefs: Record<string, PrefValue> = {}
  for (const raw of prefsString.split(',')) {
    const chunk = raw.trim()
    if (!chunk) continue

    const eq = chunk.indexOf('=')
    if (eq === -1) {
      prefs[chunk] = { enabled: true }
      continue
    }

    const key = chunk.slice(0, eq).trim()
    if (!key) continue

    const values = chunk.slice(eq + 1).split(':').map((v) => v.trim()).filter(Boolean)
    prefs[key] = { words: { values } }
  }
  return prefs
}

/**
 * Translate wire content from bokmål to nynorsk. Returns a cloned TBElement
 * tree with the same shape as the input, but with text nodes replaced by
 * their translated versions. The original input is not mutated.
 */
export async function translateWireContent(
  wireContent: TBElement[],
  mode: 'standard' | 'personal',
  options: {
    ntbUrl: string
    accessToken: string
    personalPrefs?: string
  }
): Promise<TBElement[]> {
  const cloned = structuredClone(wireContent)
  const texts = collectTexts(cloned)

  if (texts.length === 0) {
    return cloned
  }

  // `prefs_template` and `prefs` are alternatives in the NTB request - sending
  // both lets the named template override the user's explicit prefs. Personal
  // mode with no saved prefs falls back to the standard template.
  const personalPrefs = mode === 'personal' ? options.personalPrefs : undefined
  const result = await translate({
    texts: { values: texts },
    file_type: 'html',
    source_language: 'nb',
    target_language: 'nn',
    ...(personalPrefs
      ? { prefs: parsePersonalPrefs(personalPrefs) }
      : { prefs_template: 'standard' })
  }, {
    ntbUrl: options.ntbUrl,
    accessToken: options.accessToken
  })

  if (result.texts?.values?.length !== texts.length) {
    throw new Error(`Translation returned ${result.texts?.values?.length ?? 0} texts, expected ${texts.length}`)
  }

  replaceTexts(cloned, result.texts.values)
  return cloned
}
