import type { TFunction, Namespace } from 'i18next'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

export async function updateAssignmentTime<Ns extends Namespace>(
  deliverableId: string,
  planningId: string,
  newStatus: string,
  newTime: Date,
  documentType: string | undefined,
  t: TFunction<Ns>
): Promise<boolean> {
  // The server matches the deliverable by link type, so send its own type
  // (e.g. core/editorial-info), stripping any "#timeless" variant suffix.
  const deliverableType = (documentType || 'core/article').split('#')[0]

  try {
    const response = await fetch(`${BASE_URL}/api/documents/${planningId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment: {
          deliverableId,
          type: deliverableType,
          status: newStatus,
          time: newTime?.toISOString()
        }
      })
    })

    if (!response.ok) {
      console.error('Failed backend call to set assignment publish time', response.status, response.statusText)
      toast.error(t('errors:messages.changeStatusError'))
      return false
    }
  } catch (ex) {
    console.error('Failed backend call to set publish time when changing status', (ex as Error).message)
    toast.error(t('errors:messages.changeStatusError'))
    return false
  }

  return true
}
