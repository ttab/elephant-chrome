import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export type CreateHastDocumentStatus = 'usable' | 'done' | 'approved' | undefined

export async function createHast({
  ydoc,
  status,
  planningId,
  timeZone,
  documentStatus,
  section,
  startDate
}: {
  ydoc: YDocument<Y.Map<unknown>>
  status: string
  planningId?: string
  timeZone: string
  documentStatus: CreateHastDocumentStatus
  section?: {
    uuid: string
    title: string
    type: string
    rel: string
  }
  startDate?: string
}): Promise<{
  documentStatus: CreateHastDocumentStatus
  updatedPlanningId: string
} | undefined> {
  if (!ydoc || status !== 'authenticated') {
    console.error(`Failed adding hast ${ydoc.id} to a planning`)
    throw new Error('Failed to authenticate')
  }

  const snapshotPromise = snapshotDocument(ydoc.id, {
    status: documentStatus
  }, ydoc.provider?.document)
    .catch((ex) => {
      console.error('Failed creating hast snapshot', ex)
      throw new Error('HastCreationError')
    })

  const [hastTitle] = getValueByYPath<string>(ydoc.ele, 'root.title')

  const dt = new Date()
  let localDate: string
  let isoDateTime: string

  if (startDate) {
    const date = startDate.split('T')[0]
    localDate = date
    const currentTime = new Date().toISOString().split('T')[1].split('.')[0] + 'Z'
    isoDateTime = `${date}T${currentTime}`
  } else {
    isoDateTime = `${new Date().toISOString().split('.')[0]}Z`
    localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  }

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    type: 'text',
    deliverableId: ydoc.id,
    title: hastTitle || 'Ny hast',
    slugline: 'hast',
    priority: 5,
    publicVisibility: true,
    localDate,
    isoDateTime,
    section
  })

  await snapshotPromise

  if (!updatedPlanningId) {
    throw new Error('CreateAssignmentError')
  }

  return { documentStatus, updatedPlanningId }
}
