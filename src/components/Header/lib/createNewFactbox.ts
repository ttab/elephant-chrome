import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'
import { toast } from 'sonner'

export const createNewFactbox = async (repository: Repository | undefined, session: Session | null) => {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateFactbox: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })

    toast.error('Kan inte skapa faktaruta')
    return
  }

  const id = crypto.randomUUID()
  const factboxDocument = getTemplateFromView('Factbox')(id, { title: 'Fakta:' })

  try {
    await repository.saveDocument(factboxDocument, session.accessToken)
    return id
  } catch (error) {
    console.error('Error creating Factbox document:', error)
  }
}
