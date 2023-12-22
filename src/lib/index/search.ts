import { type Planning } from '@/views/PlanningOverview/PlanningTable/data/schema'
import { type JWT } from '@/types'

interface SearchIndexOptions {
  jwt: JWT
  index: string
  endpoint: URL
}

interface SearchIndexResult {
  ok: true
  total: number
  page: number
  pages: number
  pageSize: number
  hits: Planning[]
}

interface SearchIndexError {
  ok: false
  errorCode: number
  errorMessage: string
  total: 0
  pages: 0
  hits: never[]
}

export type SearchIndexResponse = SearchIndexError | SearchIndexResult

/**
 * FIXME: Implement automatic calculation of next/prev pagination values
 *
 * @param search unknown
 * @param options SearchIndexOptions
 * @returns Promise<SearchIndexResponse>
 */
export async function searchIndex(search: object, options: SearchIndexOptions, skip?: number, size?: number): Promise<SearchIndexResponse> {
  const endpoint = new URL(`${options.index}/_search`, options.endpoint)
  const pageSize = typeof size === 'number' && size > 0 && size < 500 ? size : 100
  const skipPages = typeof skip === 'number' && skip > -1 ? skip : 0
  const from = skipPages * pageSize

  const response = await fetch(endpoint.href, {
    method: 'POST',
    headers: headers(options.jwt),
    body: JSON.stringify({
      from,
      size: pageSize,
      ...search
    })
  })

  if (response.status !== 200) {
    return responseError(response.status, response.statusText)
  }

  try {
    const body = await response.json()
    const total = body?.hits?.total?.value || 0
    const hits = body?.hits?.hits?.length || 0

    return {
      ok: true,
      total: body?.hits?.total?.value || 0,
      page: skipPages + 1,
      pages: hits > 0 ? Math.ceil(total / pageSize) : 0,
      pageSize,
      hits: hits ? body.hits.hits : []
    }
  } catch (ex: unknown) {
    return responseError(0, ex instanceof Error && ex.message ? ex.message : 'Error message not defined')
  }
}


function headers(jwt: JWT): Record<string, string> {
  return {
    // FIXME: Remove "as string" when JWT/interface has been updated
    Authorization: `Bearer ${jwt.access_token}`,
    'Content-Type': 'application/json'
  }
}

function responseError(errorCode: number, errorMessage: string): SearchIndexError {
  return {
    ok: false,
    errorCode,
    errorMessage,
    total: 0,
    pages: 0,
    hits: []
  }
}
