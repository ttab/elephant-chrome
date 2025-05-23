import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Ask the backend to create an assignment with existing deliverable and add it to a planning item.
 * If no planning item id is given a new planning iten will be created.
 */
export async function addAssignmentWithDeliverable(payload: {
  planningId?: string
  type: 'flash' | 'text'
  deliverableId: string
  title: string
  priority: number
  publicVisibility: boolean
  localDate: string
  isoDateTime: string
  publishTime: string
}): Promise<string | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/api/documents/addassignment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('Failed backend call to add assignment', response.status, response.statusText)
      toast.error('Det gick inte att lägga till uppdraget i en kopplad planering.')
    }

    const result = await response.json() as { planningId: string }
    if (!result.planningId) {
      throw new Error('Incorrect or no planning id received from backend')
    }

    return result.planningId
  } catch (ex) {
    console.error('Failed backend call to add assignment', ex)
    toast.error('Det gick inte att lägga till uppdraget i en kopplad planering.')
  }
}
