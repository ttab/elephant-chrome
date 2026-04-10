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
