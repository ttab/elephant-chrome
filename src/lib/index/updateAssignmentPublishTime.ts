import type { TFunction, Namespace } from 'i18next'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

type AssignmentUpdate = {
  deliverableId: string
  type: string
  status: string
  time: string
  start_date?: string
  start?: string
}

export async function updateAssignmentTime<Ns extends Namespace>(
  deliverableId: string, planningId: string, newStatus: string, newTime: Date, t: TFunction<Ns>
) {
  const assignment: AssignmentUpdate = {
    deliverableId,
    type: 'core/article',
    status: newStatus,
    time: newTime.toISOString()
  }

  if (newStatus === 'withheld') {
    assignment['start_date'] = newTime.toISOString().split('T')[0]
    assignment['start'] = newTime.toISOString()
  }

  try {
    const response = await fetch(`${BASE_URL}/api/documents/${planningId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment
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
