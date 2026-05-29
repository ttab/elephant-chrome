import type { MediaTypes } from '..'
import type { NTBDistributor } from './ntbFetcher'

/**
 * SWR key shared by the TT and NTB fetchers. The TT fetcher reads only the
 * first three slots; `distributorNames` is NTB-only and optional.
 */
export type ImageSearchKey = [
  query: string,
  index: number,
  size: number,
  mediaType: MediaTypes,
  distributorNames?: NTBDistributor[]
]

export interface ImageSearchHit {
  id: string
  uri: string
  headline: string
  description: string
  byline: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  hiresWidth: number
  hiresHeight: number
  mediaType: 'image' | 'graphic'
  dragMimeType: 'tt/visual' | 'core/image'
  linkRel?: string
  linkType?: string
}

export interface ImageSearchResult {
  hits: ImageSearchHit[]
  total: number
}
