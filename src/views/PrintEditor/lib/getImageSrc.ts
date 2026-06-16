import type { Repository } from '@/shared/Repository'
import { getCachedSession } from '@/shared/getCachedSession'

/**
 * Resolve the `<img>` src for a print-article image block.
 *
 * Must read the session at call time rather than capturing it in a closure:
 * the textbit-plugins Image renderer is registered once at editor mount, so
 * a captured token would go stale on the next NextAuth refresh and produce
 * an empty src until the window is reloaded.
 */
export const getImageSrc = async (
  properties: Record<string, unknown>,
  repository: Repository
): Promise<string> => {
  const uploadId = properties.uploadId as string | undefined
  if (!uploadId) {
    return (properties.src as string) || ''
  }

  const session = await getCachedSession()
  if (!session?.accessToken) {
    console.warn('getImageSrc: no cached session, cannot resolve attachment', { uploadId })
    return ''
  }

  try {
    const details = await repository.getAttachmentDetails(uploadId, session.accessToken)
    if (!details?.downloadLink) {
      console.warn('getImageSrc: attachment has no downloadLink', { uploadId })
      return ''
    }
    return details.downloadLink
  } catch (ex) {
    console.error('getImageSrc: getAttachmentDetails failed', { uploadId, ex })
    throw ex
  }
}
