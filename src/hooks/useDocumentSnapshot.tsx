import useSWR, { type SWRResponse } from 'swr'
import type { EleDocument, EleDocumentResponse } from '@/shared/types'

const BASE_URL = import.meta.env.BASE_URL || ''

const fetcher = async (url: string): Promise<EleDocument | undefined> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const result = await response.json() as EleDocumentResponse
  return result.document
}

/**
 * Shared SWR-backed fetch for the `/api/documents/:id` endpoint. Multiple
 * call sites (PlainEditor, EditorHeader, MetaSheet ReadOnly) need the same
 * document; using a single hook ensures they share one cache entry instead
 * of each constructing the URL ad hoc and risking a dedup miss.
 *
 * Pass `enabled: false` (or an undefined `id`) to skip the fetch — the hook
 * will return data === undefined without hitting the network.
 */
export const useDocumentSnapshot = ({ id, version, direct = false, enabled = true }: {
  id: string | undefined
  version?: bigint
  direct?: boolean
  enabled?: boolean
}): SWRResponse<EleDocument | undefined, Error> => {
  const params = new URLSearchParams()
  if (typeof version !== 'undefined') {
    params.set('version', version.toString())
  }
  if (direct) {
    params.set('direct', 'true')
  }
  const url = id && enabled
    ? `${BASE_URL}/api/documents/${id}${params.size ? `?${params.toString()}` : ''}`
    : null

  return useSWR<EleDocument | undefined, Error>(
    url,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )
}
