import type { Repository } from '@/shared/Repository'
import { timeless as timelessTemplate } from '@/shared/templates'
import type { Session } from 'next-auth'
import { Block } from '@ttab/elephant-api/newsdoc'
import { getContentSourceLink } from '@/shared/getContentSourceLink'

/**
 * Save a new timeless article document. The caller is responsible for
 * creating/updating the companion planning that owns this timeless as a
 * deliverable (via the addassignment endpoint).
 *
 * The slugline and section are stored on the timeless itself so that later
 * conversions (timeless → article, fallback planning) always find valid
 * values to inherit. Pass them from the picked planning (existing planning
 * path) or the creation form (new planning path).
 */
export async function createNewTimelessArticle({
  repository,
  session,
  id,
  title,
  category,
  newsvalue,
  slugline,
  section,
  language
}: {
  repository: Repository | undefined
  session: Session | null
  id: string
  title: string
  category: Block
  newsvalue: string
  slugline: string
  section: Block | undefined
  language?: string
}): Promise<string> {
  if (!session?.accessToken || !repository) {
    console.error('CreateTimelessArticle: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Cannot create timeless article')
  }

  const trimmedSlugline = slugline.trim()

  try {
    const contentSource = getContentSourceLink({ org: session.org, units: session.units })
    const document = timelessTemplate(id, {
      title,
      ...(language ? { language } : {}),
      meta: {
        'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: newsvalue })],
        ...(trimmedSlugline
          ? { 'tt/slugline': [Block.create({ type: 'tt/slugline', value: trimmedSlugline })] }
          : {})
      },
      links: {
        'core/timeless-category': [category],
        ...(section ? { 'core/section': [section] } : {}),
        ...(contentSource ? { 'core/content-source': [contentSource] } : {})
      }
    })
    await repository.saveDocument(document, session.accessToken)
    return id
  } catch (error) {
    throw new Error('Cannot create timeless article', { cause: error instanceof Error ? error : undefined })
  }
}
