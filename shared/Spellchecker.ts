import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { CheckClient } from '@ttab/elephant-api/spell'
import { meta } from './meta'

export class Spellchecker {
  readonly #client: CheckClient

  constructor(repoUrl: string) {
    this.#client = new CheckClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', repoUrl).toString()
      })
    )
  }

  /**
   * Spellcheck a string of texts
   *
   * @param {string[]} text - Array of strings to spellcheck
   * @param {string} documentLanguage - Language of provided document
   * @param {string[]} supportedLanguages - String array of languages supported for spellchecking
   * @param {string} accessToken - Access token
   *
   * @returns Promise<GetDocumentResponse>
   */
  async check(text: string[], documentLanguage: string, supportedLanguages: string[], accessToken: string): Promise<Array<Array<{
    text: string
    suggestions: Array<{
      text: string
      description: string
    }>
  }>>> {
    if (!accessToken) {
      console.warn('No access token, no spellchecking')
      return []
    }

    if (!locale) {
      console.warn('No locale, no spellchecking')
      return []
    }

    const language = locale.toLowerCase().replace('_', '-')

    try {
      const { response } = await this.#client.text({
        language,
        text
      }, meta(accessToken))

      const resturnResult = !Array.isArray(response?.misspelled)
        ? []
        : response.misspelled.map((misspelled) => {
          return !Array.isArray(misspelled.entries)
            ? []
            : misspelled.entries.map((entry) => {
              return {
                text: entry.text,
                suggestions: entry.suggestions || []
              }
            })
        })

      return resturnResult
    } catch (err: unknown) {
      // Suppress error so we don't interrupt the system just because we can't check spelling
      console.error(`Unable to check spelling: ${(err as Error)?.message || 'Unknown error'}`)
    }

    return []
  }
}
