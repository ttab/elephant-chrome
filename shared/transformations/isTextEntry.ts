/**
 * Decide whether property should be converted to Y.XmlText,
 * i.e be editable using Textbit.
 *
 * @param {string} key - The property name
 * @param {unknown} t - Type value on the same level as the key
 * @returns {boolean}
 */
export function isTextEntry(key: string, t?: unknown): boolean {
  // TODO: This lookup table should live somewhere else or maybe be auto generated from revisor schemas
  const lookupMap: Record<string, string[]> = {
    'tt/slugline': [
      'value'
    ],
    '*': [
      'text', 'title'
    ]
  }

  const type = typeof t === 'string' ? t : ''

  if (lookupMap[type]?.includes(key)) {
    return true
  }

  return lookupMap['*']?.includes(key)
}
