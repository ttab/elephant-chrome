import { type Planning } from '@/views/PlanningOverview/PlanningTable/data/schema'

interface SearchIndexOptions {
  accessToken: string
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
 * @param search - object
 * @param options - SearchIndexOptions
 * @param page - number Optional, defaults to 1
 * @param size - number Optionally wanted page size, defaults to 100
 * @returns Promise<SearchIndexResponse>
 */
export async function searchIndex(search: object, options: SearchIndexOptions, page: number = 1, size: number = 100): Promise<SearchIndexResponse> {
  const endpoint = new URL(`${options.index}/_search`, options.endpoint)
  const { skip, size: pageSize } = pagination({
    page,
    size
  })

  const response = await fetch(endpoint.href, {
    method: 'POST',
    headers: headers(options.accessToken),
    body: JSON.stringify({
      from: skip,
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
      page: page || 1,
      pages: hits > 0 ? Math.ceil(total / pageSize) : 0,
      pageSize,
      hits: hits ? body.hits.hits : []
    }
  } catch (ex: unknown) {
    return responseError(0, ex instanceof Error && ex.message ? ex.message : 'Error message not defined')
  }
}


function headers(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
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

function pagination(paginationOptions?: {
  page: number
  size: number
}): { skip: number, size: number } {
  const defaultPageSize = 100
  const defaultPage = 1

  let {
    page = defaultPage,
    size: pageSize = defaultPageSize
  } = paginationOptions || {}

  if (isNaN(page) || page < 1) {
    page = defaultPage
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
    pageSize = defaultPageSize
  }

  return {
    skip: (page - 1) * pageSize,
    size: pageSize
  }
}
