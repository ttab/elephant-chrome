import type { Repository } from '@/shared/Repository'
import { toast } from 'sonner'
const BASE_URL = import.meta.env.BASE_URL || ''

export const reset = async (repository: Repository, documentId: string, accessToken: string) => {
  try {
    const usableDocument = await repository.getStatuses({ uuids: [documentId], statuses: ['usable'], accessToken: accessToken })
    const usableVersion = usableDocument?.items[0].heads.usable.version

    const response = await fetch(`${BASE_URL}/api/documents/${documentId}/restore?version=${usableVersion}`, {
      method: 'POST'
    })

    if (!response.ok) {
      console.error('Failed to reset document', response.status, response.statusText)
      toast.error('Det gick inte återställa dokumentet.')
    }
  } catch (error) {
    toast.error('Det gick inte att återställa dokumentet')
    console.error('error while restoring document: ', error)
  }
}
