import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'
import type { TwoOnTwoData } from '@/shared/types'

export async function createTwoOnTwo({
  planningId,
  startDate,
  timeZone,
  data
}: {
  planningId: string
  timeZone: string
  startDate?: string
  data: TwoOnTwoData | undefined
}) {
  const dt = new Date()
  let localDate: string
  let isoDateTime: string

  if (startDate) {
    // Use provided start date
    const date = startDate.split('T')[0]
    localDate = date
    const currentTime = new Date().toISOString().split('T')[1].split('.')[0] + 'Z'
    isoDateTime = `${date}T${currentTime}`
  } else {
    // create new date
    isoDateTime = `${new Date().toISOString().split('.')[0]}Z`
    localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  }

  const assignmentId = await addAssignmentWithDeliverable({
    planningId,
    type: 'text',
    deliverableId: data?.deliverableId || crypto.randomUUID(),
    title: 'Kort första text',
    slugline: data?.payload.meta['tt/slugline'][0].value,
    priority: 5,
    publicVisibility: true,
    localDate,
    isoDateTime,
    section: { uuid: data?.payload.links['core/section'][0].uuid || '', title: data?.payload.links['core/section'][0].title || '' },
    twoOnTwoData: data
  })

  if (!assignmentId) {
    throw new Error('twoOnTwoCreationError')
  }
}
