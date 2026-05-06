import type { TBElement } from '@ttab/textbit'
import * as Y from 'yjs'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
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

/**
 * Convert the comma-separated personal prefs string to the map format
 * expected by the Nynorsk API: { "form_name": { "enabled": true } }
 */
function parsePersonalPrefs(prefsString: string): Record<string, { enabled: boolean }> {
  const prefs: Record<string, { enabled: boolean }> = {}
  for (const key of prefsString.split(',')) {
    if (key) {
      prefs[key] = { enabled: true }
    }
  }
  return prefs
}

/**
 * Convert TBElement content to a Y.XmlText suitable for setting on a Y.Doc.
 */
export function toContentYXmlText(content: TBElement[]): Y.XmlText {
  const yContent = new Y.XmlText()
  yContent.applyDelta(slateNodesToInsertDelta(content))
  return yContent
}

/**
 * Translate wire content from bokmål to nynorsk and return a Y.XmlText
 * suitable for setting as article content on a Y.Doc.
 */
export async function translateWireContent(
  wireContent: TBElement[],
  mode: 'standard' | 'personal',
  options: {
    ntbUrl: string
    accessToken: string
    personalPrefs?: string
  }
): Promise<Y.XmlText> {
  const cloned = structuredClone(wireContent)
  const texts = collectTexts(cloned)

  if (texts.length > 0) {
    const result = await translate({
      texts: { values: texts },
      file_type: 'html',
      source_language: 'nb',
      target_language: 'nn',
      prefs_template: 'standard',
      ...(mode === 'personal' && options.personalPrefs ? { prefs: parsePersonalPrefs(options.personalPrefs) } : {})
    }, {
      ntbUrl: options.ntbUrl,
      accessToken: options.accessToken
    })

    if (result.texts?.values?.length !== texts.length) {
      throw new Error(`Translation returned ${result.texts?.values?.length ?? 0} texts, expected ${texts.length}`)
    }

    replaceTexts(cloned, result.texts.values)
  }

  const yContent = new Y.XmlText()
  yContent.applyDelta(slateNodesToInsertDelta(cloned))
  return yContent
}
