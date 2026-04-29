import type { Repository } from '@/shared/Repository'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import type { Session } from 'next-auth'
import i18next from 'i18next'

export const createNewFactbox = async (repository: Repository | undefined, session: Session | null, id: string) => {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateFactbox: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error(i18next.t('errors:messages.couldNotCreateNewFactbox'))
  }

  try {
    const factboxDocument = getTemplateFromView('Factbox')(id, { title: `${i18next.t('editor:factbox.factboxNewTitle')}:` })
    await repository.saveDocument(factboxDocument, session.accessToken)
    return id
  } catch (error) {
    throw new Error(i18next.t('errors:messages.couldNotCreateNewFactbox'), { cause: error instanceof Error ? error : undefined })
  }
}
