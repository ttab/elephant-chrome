/**
 * Cases where the autonym is more verbose tha the conventional name.
 * Instead of "norsk bokmål" or "norsk nynorsk" we use "bokmål" or "nynorsk".
 * Add an entry only when `Intl.DisplayNames` output diverges from how the
 * language is normally written in pickers / pills.
 */
const AUTONYM_OVERRIDES: Record<string, string> = {
  nb: 'Bokmål',
  nn: 'Nynorsk'
}

/**
 * Returns the autonym (a language's name in itself) for a BCP-47 language
 * code, with the first letter capitalized.
 *
 * Resolution order:
 *   1. Use only the language part of the BCP-47 tag.
 *   2. Look up an override (CLDR-verbose cases like nb/nn).
 *   3. Otherwise ask `Intl.DisplayNames` for the language name *in that same
 *      language* (i.e. the autonym): `sv` → "svenska", `en` → "English",
 *      `pl` → "polski".
 *   4. Capitalize the first character so the pill reads as a proper name
 *      regardless of the language's own casing convention.
 *   5. If `Intl` can't resolve the code (returns the input back, or throws),
 *      return the original code so the UI never goes blank.
 */
export function getLanguageLabel(code: string | undefined): string {
  if (!code) return ''

  const language = code.split('-')[0]?.toLowerCase()
  if (!language) return code

  if (AUTONYM_OVERRIDES[language]) {
    return AUTONYM_OVERRIDES[language]
  }

  try {
    const autonym = new Intl.DisplayNames([language], { type: 'language' }).of(language)
    if (!autonym || autonym.toLowerCase() === language) {
      return code
    }
    return autonym.charAt(0).toLocaleUpperCase(language) + autonym.slice(1)
  } catch {
    return code
  }
}
