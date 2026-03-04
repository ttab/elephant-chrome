import type { Wire } from '@/shared/schemas/wire'
import type { QuickArticleData } from '@/shared/types'

import { toast } from 'sonner'
import i18n from 'i18next'

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
  wires?: Wire[]
  quickArticleData?: QuickArticleData
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
      toast.error(i18n.t('errors:toasts.addAssignmentToPlanningError'))
      const body = await response.text().catch(() => '(unreadable)')
      console.error('Failed backend call to add assignment', response.status, response.statusText, body)
      throw new Error(`Backend returned ${response.status}: ${body}`)
    }

    const result = await response.json() as { uuid: string }

    if (!result.uuid) {
      console.error('Failed backend call to add assignment: no uuid in response', result)
      throw new Error('No uuid in response from addassignment')
    }

    return result.uuid
  } catch (ex) {
    console.error('Failed backend call to add assignment', ex)
    toast.error(i18n.t('errors:toasts.addAssignmentToPlanningError'))
  }
}
