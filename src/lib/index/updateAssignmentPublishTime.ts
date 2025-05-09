import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

export async function updateAssignmentPublishTime(
  deliverableId: string, planningId: string, newStatus: string, newPublishTime: Date
) {
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
          publishTime: newPublishTime?.toISOString()
        }
      })
    })

    if (!response.ok) {
      console.error('Failed backend call to set assignment publish time', response.status, response.statusText)
      toast.error('Det gick inte att ändra status. Uppdragets publiceringstid kunde inte ändras i den kopplade planeringen.')
      return false
    }
  } catch (ex) {
    console.error('Failed backend call to set publish time when changing status', (ex as Error).message)
    toast.error('Det gick inte att ändra status. Uppdragets publiceringstid kunde inte ändras i den kopplade planeringen.')
    return false
  }
}
