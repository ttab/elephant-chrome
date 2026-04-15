import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'

export async function createNewTimelessArticle(
  repository: Repository | undefined,
  session: Session | null,
  id: string
): Promise<string> {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateTimelessArticle: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Cannot create timeless article')
  }

  try {
    const document = getTemplateFromView('TimelessArticle')(id)
    await repository.saveDocument(document, session.accessToken)
    return id
  } catch (error) {
    throw new Error('Cannot create timeless article', { cause: error instanceof Error ? error : undefined })
  }
}
