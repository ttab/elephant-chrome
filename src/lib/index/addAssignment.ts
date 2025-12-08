import type { Wire } from '@/shared/schemas/wire'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Ask the backend to create an assignment with existing deliverable and add it to a planning item.
 * If no planning item id is given a new planning item will be created.
 */
export async function addAssignmentWithDeliverable(payload: {
  planningId?: string
  planningTitle?: string
  type: 'flash' | 'text'
  deliverableId: string
  title: string
  slugline?: string
  priority?: number
  publicVisibility: boolean
  localDate: string
  isoDateTime: string
  publishTime?: string
  section?: {
    uuid: string
    title: string
  }
  twoOnTwoData?: { title?: string, text?: string }
  wire?: Wire
}): Promise<string | undefined> {
  try {
    const response = await fetch(`${BASE_URL}/api/documents/${payload.planningId || 'create'}/addassignment/`, {
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

    const result = await response.json() as { uuid: string }
    if (!result.uuid) {
      throw new Error('Incorrect or no planning id received from backend')
    }

    return result.uuid
  } catch (ex) {
    console.error('Failed backend call to add assignment', ex)
    toast.error('Det gick inte att lägga till uppdraget i en kopplad planering.')
  }
}
