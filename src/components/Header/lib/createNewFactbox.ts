import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'

export const createNewFactbox = async (repository: Repository | undefined, session: Session | null, id: string) => {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateFactbox: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Kan inte skapa faktaruta')
  }

  try {
    const factboxDocument = getTemplateFromView('Factbox')(id, { title: 'Fakta:' })
    await repository.saveDocument(factboxDocument, session.accessToken)
    return id
  } catch (error) {
    throw new Error('Kan inte skapa faktaruta', { cause: error instanceof Error ? error : undefined })
  }
}
