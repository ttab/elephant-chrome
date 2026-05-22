import type { Repository } from '@/shared/Repository'
import { getCachedSession } from '@/shared/getCachedSession'

/**
 * Resolve the `<img>` src for a print-article image block.
 *
 * Called by textbit-plugins' Image renderer. Must read the session at call
 * time rather than capturing it in a closure - textbit freezes the plugin
 * registry at editor mount, so a captured token goes stale as soon as the
 * NextAuth session refreshes (~every 2.5 min), causing uploads to succeed
 * but render with an empty src until the window is reloaded.
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
  const details = await repository.getAttachmentDetails(uploadId, session?.accessToken || '')
  return details?.downloadLink ?? ''
}
