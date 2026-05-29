import type { Session } from 'next-auth'
import { toast } from 'sonner'
import type { NTB } from '@/shared/NTB'
import { PreviewType, SearchRequest, type MediaItem } from '@ttab/elephant-tt-api/ntb'

export const NPK_DISTRIBUTOR = 'NPK'

/**
 * Distributors whose catalogue sits outside the normal subscription. Selecting
 * one forces `outsideSubscription` on, since those items are otherwise filtered
 * out of the results.
 */
export const NTB_DISTRIBUTORS = [NPK_DISTRIBUTOR, 'NTB tema'] as const

export type NTBDistributor = (typeof NTB_DISTRIBUTORS)[number]

/** Keycloak unit marking a user as belonging to NPK (Nynorsk Pressekontor). */
export const NPK_UNIT = '/redaktionen-npk'

interface NTBPreview {
  width: number
  height: number
  url: string
  type: PreviewType
}
import type { ImageSearchHit, ImageSearchKey, ImageSearchResult } from './types'

function findPreviewByWidth(
  previews: NTBPreview[],
  prefer: 'smallest' | 'largest'
): NTBPreview | undefined {
  const imagePreviews = previews.filter(
    (p) => p.type === PreviewType.PREVIEW_IMAGE
  )
  if (imagePreviews.length === 0) return undefined
  return imagePreviews.reduce((best, p) =>
    prefer === 'smallest'
      ? (p.width < best.width ? p : best)
      : (p.width > best.width ? p : best)
  )
}

export function mapNTBItem(item: MediaItem): ImageSearchHit | undefined {
  const thumbnail = findPreviewByWidth(item.previews, 'smallest')
  const preview = findPreviewByWidth(item.previews, 'largest')

  if (!thumbnail?.url || !preview?.url) {
    return undefined
  }

  return {
    id: item.id,
    uri: `mediamanager://image/ntb/${item.id}`,
    headline: item.headline,
    description: item.description,
    byline: item.creator,
    thumbnailUrl: thumbnail.url,
    previewUrl: preview.url,
    originalUrl: preview.url,
    hiresWidth: item.file?.width ?? 0,
    hiresHeight: item.file?.height ?? 0,
    mediaType: 'image',
    dragMimeType: 'core/image',
    linkRel: 'image',
    linkType: 'mediamanager/image'
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (ex) {
      if (attempt === maxRetries) {
        throw ex
      }
      const delay = baseDelayMs * 2 ** attempt
      console.warn(`NTB search attempt ${attempt + 1} failed, retrying in ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}

export const createNTBFetcher = (
  ntb: NTB,
  session: Session | null,
  archive: string
) =>
  async ([queryString, index, SIZE, , distributorNames = []]: ImageSearchKey
  ): Promise<ImageSearchResult> => {
    if (!session) {
      toast.error('Kan inte autentisera mot bildtjänsten')
      throw new Error('ImageSearch Error: No session for user')
    }

    try {
      const { response } = await withRetry(() =>
        ntb.search(
          SearchRequest.create({
            archive,
            query: queryString,
            limit: SIZE,
            offset: index * SIZE,
            distributorNames,
            outsideSubscription: distributorNames.length > 0
          }),
          session.accessToken
        )
      )

      const data = response.data ?? []

      return {
        hits: data
          .map(mapNTBItem)
          .filter((hit): hit is ImageSearchHit => hit !== undefined),
        total: response.page?.total ?? 0
      }
    } catch (ex) {
      console.error('NTB image search failed:', ex)
      toast.error('Bildsökning misslyckades')
      throw ex
    }
  }
