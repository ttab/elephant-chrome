import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { CheckClient } from '@ttab/elephant-api/spell'
import { meta } from './meta'
import { getCachedSession } from './getCachedSession'

type SpellSuggestion = {
  text: string
  description: string
}

export class Spellchecker {
  readonly #client: CheckClient

  constructor(repoUrl: string) {
    this.#client = new CheckClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString(),
        sendJson: true,
        jsonOptions: {
          ignoreUnknownFields: true
        }
      })
    )
  }

  /**
   * Spellcheck a string of texts. Suggestions are not generated here as the
   * server-side cost is high; fetch them on demand via {@link suggestions}
   * (e.g. when the user right-clicks a misspelled word).
   *
   * @param {string[]} text - Array of strings to spellcheck
   * @param {string} documentLanguage - Language of provided document
   * @param {string[]} supportedLanguages - String array of languages supported for spellchecking
   */
  async check(text: string[], documentLanguage: string, supportedLanguages: string[]): Promise<Array<Array<{
    text: string
    suggestions: SpellSuggestion[]
  }>>> {
    const session = await getCachedSession()

    if (!session?.accessToken) {
      console.warn('No access token, no spellchecking')
      return []
    }

    const language = this.#resolveLanguage(documentLanguage, supportedLanguages)

    if (!language) {
      return []
    }

    try {
      const { response } = await this.#client.text({
        language,
        text,
        suggestions: false
      }, meta(session.accessToken))

      return !Array.isArray(response?.misspelled)
        ? []
        : response.misspelled.map((misspelled) => {
          return !Array.isArray(misspelled.entries)
            ? []
            : misspelled.entries.map((entry) => ({
              text: entry.text,
              suggestions: []
            }))
        })
    } catch (err: unknown) {
      // Suppress error so we don't interrupt the system just because we can't check spelling
      console.error(`Unable to check spelling: ${(err as Error)?.message || 'Unknown error'}`)
    }

    return []
  }

  /**
   * Get suggestions for a single misspelled word or phrase. Intended to be
   * called on demand (e.g. when the user opens the context menu on a
   * misspelling) to avoid the cost of generating suggestions for every
   * misspelling found during a regular {@link check}.
   *
   * @param {string} text - Misspelled word or phrase
   * @param {string} documentLanguage - Language of provided document
   * @param {string[]} supportedLanguages - String array of languages supported for spellchecking
   */
  async suggestions(text: string, documentLanguage: string, supportedLanguages: string[]): Promise<SpellSuggestion[]> {
    const session = await getCachedSession()

    if (!session?.accessToken) {
      console.warn('No access token, no suggestions')
      return []
    }

    const language = this.#resolveLanguage(documentLanguage, supportedLanguages)

    if (!language || !text) {
      return []
    }

    try {
      const { response } = await this.#client.suggestions({
        language,
        text
      }, meta(session.accessToken))

      return Array.isArray(response?.suggestions)
        ? response.suggestions.map((s) => ({
          text: s.text,
          description: s.description
        }))
        : []
    } catch (err: unknown) {
      console.error(`Unable to get suggestions: ${(err as Error)?.message || 'Unknown error'}`)
    }

    return []
  }

  #resolveLanguage(documentLanguage: string, supportedLanguages: string[]): string | undefined {
    if (!documentLanguage) {
      console.warn('No document language provided, no spellchecking')
      return undefined
    }

    let lang = documentLanguage

    // For now, documents in swedish need to be explicitly set to sv-se in order to work
    if (lang === 'sv') {
      lang = 'sv-se'
    }

    // We default language: 'en' to be british english
    if (lang === 'en') {
      lang = 'en-gb'
    }

    lang = lang.toLowerCase().replace('_', '-')

    if (!supportedLanguages.includes(lang)) {
      console.warn(lang, 'not supported, no spellchecking')
      return undefined
    }

    return lang
  }
}
