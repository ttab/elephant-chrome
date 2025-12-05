import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'

export async function createTwoOnTwo({
  planningId,
  startDate,
  timeZone,
  section,
  data
}: {
  planningId: string
  timeZone: string
  startDate?: string
  section?: {
    uuid: string
    title: string
  }
  data?: {
    title: string | undefined
    text: string
    deliverableId: string
  }
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

  const slugline = `${data?.title?.toLocaleLowerCase().split(' ').slice(3).join('-')}-2på2`
  console.log('🚀 ~ :41 ~ createTwoOnTwo ~ slugline:', slugline)

  const assignmentId = await addAssignmentWithDeliverable({
    planningId,
    type: 'text',
    deliverableId: data?.deliverableId || crypto.randomUUID(),
    title: 'Kort första text',
    slugline,
    priority: 4,
    publicVisibility: true,
    localDate,
    isoDateTime,
    section,
    twoOnTwoData: data
  })

  if (!assignmentId) {
    throw new Error('twoOnTwoCreationError')
  }
}
