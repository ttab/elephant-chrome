import { type Session } from 'next-auth'

interface ElephantSpellCheckResponse {
  misspelled: Array<{
    entries: Array<{
      text: string
      suggestions: Array<{
        text: string
      }>
    }>
  }>
}

export const checkSpelling = async (session: Session | null, spellcheckUrl: URL, texts: string[]): Promise<Array<Array<{
  text: string
  suggestions: string[]
}>>> => {
  try {
    const spellingUrl = new URL('/twirp/elephant.spell.Check/Text', spellcheckUrl.href)

    const response = await fetch(spellingUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session?.accessToken
      },
      body: JSON.stringify({
        language: 'sv-se',
        text: texts
      })
    })

    if (response.ok) {
      const result = await response.json() as ElephantSpellCheckResponse
      const resturnResult = !Array.isArray(result?.misspelled)
        ? []
        : result.misspelled.map((misspelled) => {
          return !Array.isArray(misspelled.entries)
            ? []
            : misspelled.entries.map(entry => {
              return {
                text: entry.text,
                suggestions: entry.suggestions.map(s => s.text)
              }
            })
        })

      return resturnResult
    }
  } catch (ex) {
    // Don't interrupt system just because we can't check spelling
    console.error('Failed fetching metadata', { cause: ex as Error })
  }

  return []
}
