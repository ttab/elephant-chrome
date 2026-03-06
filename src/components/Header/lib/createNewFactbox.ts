import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'
import { toast } from 'sonner'

export const createNewFactbox = async (repository: Repository | undefined, session: Session | null, id: string) => {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateFactbox: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    console.error('Missing required dependencies for creating Factbox')
    toast.error('Kan inte skapa faktaruta')
    return
  }

  try {
    const factboxDocument = getTemplateFromView('Factbox')(id, { title: 'Fakta:' })
    await repository.saveDocument(factboxDocument, session.accessToken)
    return id
  } catch (error) {
    console.error('Error creating Factbox document:', error)
    toast.error('Kan inte skapa faktaruta')
  }
}
