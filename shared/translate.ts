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

/**
 * Translate texts via the NTB Nynorsk Twirp service. Called from the
 * browser directly because the BFF can't reach the cluster-internal NTB
 * address in deployed environments.
 */
export async function translate(
  request: TranslateRequest,
  options: { ntbUrl: string, accessToken: string }
): Promise<TranslateResponse> {
  const url = new URL('twirp/ttab.ntb.Nynorsk/Translate', options.ntbUrl).toString()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${options.accessToken}`
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(120_000)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(`Translation failed: ${text}`)
  }

  return response.json() as Promise<TranslateResponse>
}
