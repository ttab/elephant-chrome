import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'

export const createNewFactbox = async (repository: Repository | undefined, session: Session | null) => {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateFactbox: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Missing required dependencies for creating Factbox')
  }

  const id = crypto.randomUUID()
  try {
    const factboxDocument = getTemplateFromView('Factbox')(id, { title: 'Fakta:' })
    await repository.saveDocument(factboxDocument, session.accessToken)
    return id
  } catch (error) {
    throw error instanceof Error ? error : new Error('Error creating Factbox document')
  }
}
