export interface TranslateRequest {
  texts: { values: string[] }
  file_type: string
  source_language: string
  target_language: string
  prefs_template?: string
  prefs?: Record<string, { enabled: boolean }>
}

export interface TranslateResponse {
  texts: { values: string[] }
  guid: string
}

const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Translate texts via the backend /api/translate proxy.
 */
export async function translate(request: TranslateRequest): Promise<TranslateResponse> {
  const response = await fetch(`${BASE_URL}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(`Translation failed: ${text}`)
  }

  return response.json() as Promise<TranslateResponse>
}
