import { type ttninjs } from '@ttab/api-client'
import { Api } from '@ttab/api-client'
import type { Session } from 'next-auth'
import { toast } from 'sonner'
import { productCodes } from './productCodes'
import type { MediaTypes } from '..'
import type { ImageSearchHit, ImageSearchResult } from './types'
import { findRenditionByUsageAndVariant, type renditions } from './find-rendition'

const BASE_URL = import.meta.env.BASE_URL || ''

function apiClient(token: string, host: URL): Api {
  const client = new Api({ host: host.origin, token, timeout: 6000 })
  return client
}

function extractIdFromUrl(href: string): string | undefined {
  try {
    return new URL(href).pathname.split('/').filter(Boolean).pop()
  } catch (ex) {
    console.warn(`Failed to extract ID from rendition URL: "${href}"`, ex)
    return undefined
  }
}

function mapTTHit(hit: ttninjs, mediaType: MediaTypes): ImageSearchHit | undefined {
  const hitRenditions = hit.renditions as renditions
  const thumbnail = findRenditionByUsageAndVariant(hitRenditions, 'Thumbnail', 'Normal')
  const preview = findRenditionByUsageAndVariant(hitRenditions, 'Preview', 'Normal')
  const hires = findRenditionByUsageAndVariant(hitRenditions, 'Hires', 'Normal')

  if (!thumbnail.href || thumbnail.href === 'not found'
    || !preview.href || preview.href === 'not found') {
    return undefined
  }

  const mediaPath = mediaType === 'graphic' ? 'graphics' : 'images'
  const id = extractIdFromUrl(preview.href)
  const proxyUrl = id ? `${BASE_URL}/api/${mediaPath}/${id}` : preview.href

  return {
    id: hit.uri,
    uri: hit.uri,
    headline: hit.headline ?? '',
    description: hit.description_text ?? '',
    byline: hit.byline ?? '',
    thumbnailUrl: thumbnail.href,
    previewUrl: proxyUrl,
    originalUrl: preview.href,
    hiresWidth: hires.width ?? 0,
    hiresHeight: hires.height ?? 0,
    mediaType: mediaType === 'graphic' ? 'graphic' : 'image',
    dragMimeType: 'tt/visual'
  }
}

export const createTTFetcher = (
  url: URL,
  session: Session | null,
  mediaType: MediaTypes
) =>
  async ([queryString, index, SIZE]: [string, number, number]): Promise<ImageSearchResult> => {
    if (!session) {
      toast.error('Kan inte autentisera mot bildtjänsten')
      throw new Error('ImageSearch Error: No session for user')
    }

    try {
      const client = apiClient(session.accessToken, url)
      const result = await client.content.search(mediaType, {
        sort: 'default:desc',
        p: productCodes,
        q: queryString,
        pubstatus: ['usable', 'commissioned'],
        s: SIZE,
        fr: index * SIZE
      })

      return {
        hits: result.hits
          .map((hit) => mapTTHit(hit, mediaType))
          .filter((hit): hit is ImageSearchHit => hit !== undefined),
        total: result.total
      }
    } catch (ex) {
      console.error('TT image search failed:', ex)
      toast.error('Bildsökning misslyckades')
      throw ex
    }
  }
