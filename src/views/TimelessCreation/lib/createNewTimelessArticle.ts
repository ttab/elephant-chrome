import type { Repository } from '@/shared/Repository'
import { timeless as timelessTemplate } from '@/shared/templates'
import type { Session } from 'next-auth'
import { Block } from '@ttab/elephant-api/newsdoc'

/**
 * Save a new timeless article document. The caller is responsible for
 * creating/updating the companion planning that owns this timeless as a
 * deliverable (via the addassignment endpoint).
 */
export async function createNewTimelessArticle(
  repository: Repository | undefined,
  session: Session | null,
  id: string,
  title: string,
  category: Block,
  newsvalue: string
): Promise<string> {
  if (!session?.accessToken || !repository) {
    console.error('CreateTimelessArticle: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Cannot create timeless article')
  }

  try {
    const document = timelessTemplate(id, {
      title,
      meta: {
        'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: newsvalue })]
      },
      links: { 'core/timeless-category': [category] }
    })
    await repository.saveDocument(document, session.accessToken)
    return id
  } catch (error) {
    throw new Error('Cannot create timeless article', { cause: error instanceof Error ? error : undefined })
  }
}
