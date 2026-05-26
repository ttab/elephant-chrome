import type { TFunction, Namespace } from 'i18next'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

export async function updateAssignmentTime<Ns extends Namespace>(
  deliverableId: string, planningId: string, newStatus: string, newTime: Date, t: TFunction<Ns>
) {
  // DEV-ONLY: [SCHED] last hop before the backend; this is what the planning
  // assignment will be updated to.
  const isoTime = newTime?.toISOString()
  console.log('[SCHED] updateAssignmentTime -> PATCH /api/documents/:planningId', {
    deliverableId,
    planningId,
    newStatus,
    isoTime,
    asStockholm: newTime?.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }),
    asSydney: newTime?.toLocaleString('sv-SE', { timeZone: 'Australia/Sydney' })
  })

  try {
    const response = await fetch(`${BASE_URL}/api/documents/${planningId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment: {
          deliverableId,
          type: 'core/article',
          status: newStatus,
          time: isoTime
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
}
