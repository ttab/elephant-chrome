import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/shared/getCachedSession', () => ({
  getCachedSession: vi.fn().mockResolvedValue({ accessToken: 'token' })
}))

import { Spellchecker } from '@/shared/Spellchecker'

/**
 * Answer the Twirp call the way elephant-spell does: JSON, enums by name, and
 * the zero value (LEVEL_UNSPECIFIED) left out entirely. Going through the real
 * transport means the enum decoding is exercised, not assumed.
 */
function respondWith(body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  )
}

describe('Spellchecker.check - correction level', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes the level of each entry through to textbit', async () => {
    respondWith({
      misspelled: [{
        entries: [
          { text: 'teh', level: 'LEVEL_ERROR' },
          { text: 'utilise', level: 'LEVEL_SUGGESTION' }
        ]
      }]
    })

    const result = await new Spellchecker('https://repo.test/')
      .check(['teh utilise'], 'sv', ['sv-se'])

    expect(result).toEqual([[
      { text: 'teh', level: 'error', suggestions: [] },
      { text: 'utilise', level: 'suggestion', suggestions: [] }
    ]])
  })

  it('treats an entry without a level as an error', async () => {
    respondWith({ misspelled: [{ entries: [{ text: 'teh' }] }] })

    const result = await new Spellchecker('https://repo.test/')
      .check(['teh'], 'sv', ['sv-se'])

    expect(result).toEqual([[{ text: 'teh', level: 'error', suggestions: [] }]])
  })
})
