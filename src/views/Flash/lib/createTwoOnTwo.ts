import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'
import { convertToISOStringInTimeZone } from '@/shared/datetime'

type TwoOnTwoData = {
  title: string | undefined
  text: string
  deliverableId: string
} | undefined

type Section = {
  uuid: string
  title: string
} | undefined

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
  section?: Section
  data?: TwoOnTwoData
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

  const makeSlugline = (twoOnTwoData: TwoOnTwoData) => {
    if (!twoOnTwoData?.title) {
      return '2på2-text'
    }

    return twoOnTwoData?.title?.toLocaleLowerCase()?.split(' ').slice(0, 3).join('-') + '-2på2'
  }

  // Make unique slugline for flash, considering there could
  // potentially be multiple flash assignments each day.
  const slugline = makeSlugline(data)

  const assignmentId = await addAssignmentWithDeliverable({
    planningId,
    type: 'text',
    deliverableId: data?.deliverableId || crypto.randomUUID(),
    title: 'Kort första text',
    slugline,
    priority: 5,
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
