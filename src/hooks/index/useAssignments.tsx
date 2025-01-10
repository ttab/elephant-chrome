import useSWR from 'swr'
import { BoolQueryV1, QueryV1 } from '@ttab/elephant-api/index'
import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import { parseISO, getHours } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { BulkGetResponse, GetStatusOverviewResponse } from '@ttab/elephant-api/repository'
import { useRepositoryEvents } from '../useRepositoryEvents'

interface AssignmentInterface extends Block {
  _id: string
  _deliverableId: string
  _deliverableStatus?: string
  _deliverableDocument?: Document
  _title: string
  _newsvalue?: string
  _section?: string
  _statusData?: string
}

interface AssignmentResponseInterface {
  key?: string
  label?: string
  hours?: number[]
  items: AssignmentInterface[]
}

// We want to fetch all known statuses for deliverables and then
// filter them using the supplied "statuses" prop.
const knownStatuses = [
  'done',
  'approved',
  'withheld',
  'usable',
  'canceled'
]

/**
 * Fetch all assignments in specific date as Block[] extended with some planning level data.
 * Allows optional filtering by type and optional sorting into buckets.
 *
 * @todo Filter by section
 */
export const useAssignments = ({ date, type, slots, statuses }: {
  date: Date | string
  type?: string
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
  statuses: string[] // Statuses wanted
}) => {
  const session = useSession()
  const { index, repository, timeZone } = useRegistry()
  const key = type ? `core/assignment/${type}/${date.toString()}` : 'core/assignment'

  const { data, mutate } = useSWR(key, async (): Promise<AssignmentResponseInterface[]> => {
    if (!index || !session?.data?.accessToken) {
      return [{
        items: []
      }]
    }

    const size = 100
    let page = 1
    const assignments: AssignmentInterface[] = []
    const deliverableStatusesRequests: Promise<GetStatusOverviewResponse | null>[] = []
    const deliverableDocumentsRequests: Promise<BulkGetResponse | null>[] = []

    do {
      const { ok, hits, errorMessage } = await index.query({
        accessToken: session.data.accessToken,
        documentType: 'core/planning-item',
        page,
        size,
        loadDocument: true,
        query: getQuery(date)
      })

      if (!ok) {
        throw new Error(errorMessage || 'Unknown error while searching for text assignments')
      }

      // Collect all deliverable uuids for this page
      const uuids: string[] = []

      hits.forEach((hit) => {
        if (!hit.document) {
          return
        }

        // Extract planning level data
        getAssignments(hit.document, type).forEach((assignment) => {
          if (assignment._deliverableId) {
            uuids.push(assignment._deliverableId)
          }
          assignments.push(assignment)
        })
      })

      // Initialize a getStatuses request for this result page
      const statusRequest = repository?.getStatuses({
        uuids,
        statuses: knownStatuses,
        accessToken: session.data.accessToken
      })
      if (statusRequest) {
        deliverableStatusesRequests.push(statusRequest)
      }

      // Initialize a getDocuments request for this result page
      const documentsRequest = repository?.getDocuments({
        uuids,
        accessToken: session.data.accessToken
      })
      if (documentsRequest) {
        deliverableDocumentsRequests.push(documentsRequest)
      }

      page = hits?.length === size ? page + 1 : 0
    } while (page)

    const filteredTextAssignments: AssignmentInterface[] = []

    // Wait for all status requests to finish and find status for each deliverable
    const statusResponses = await Promise.all(deliverableStatusesRequests)
    statusResponses.forEach((statusResponse) => {
      statusResponse?.items.forEach((itemStatuses) => {
        const status = Object.keys(itemStatuses.heads).reduce((prevStatus, currStatus) => {
          if (!prevStatus || itemStatuses.heads[currStatus].version > itemStatuses.heads[prevStatus].version) {
            return currStatus
          } else {
            return prevStatus
          }
        }, '') || 'draft' // Default to draft (empty status)

        if (statuses.includes(status)) {
          const t = assignments.find((t) => t._deliverableId == itemStatuses.uuid)
          if (t) {
            filteredTextAssignments.push({
              ...t,
              _deliverableStatus: status,
              _statusData: JSON.stringify(itemStatuses, (_, val) => { return typeof val === 'bigint' ? val.toString() : val as unknown }, 2)
            })
          }
        }
      })
    })

    // Wait for all documents requests to finish and find document for each deliverable
    const documentsResponses = await Promise.all(deliverableDocumentsRequests)
    documentsResponses.forEach((documentsResponse) => {
      documentsResponse?.items.forEach((item) => {
        const matchingAssignment = filteredTextAssignments.find((fta) => {
          return fta._deliverableId === item.document?.uuid
        })

        if (matchingAssignment) {
          matchingAssignment._deliverableDocument = item.document
        }
      })
    })

    // Plannings can have multiple assignments stretching over a full day
    // so we need to sort assignments
    filteredTextAssignments.sort((a, b) => {
      const at = a.data.publish ? parseISO(a.data.publish) : 0
      const bt = b.data.publish ? parseISO(b.data.publish) : 0

      return bt.valueOf() - at.valueOf()
    })

    // Return one slot with no key/label/hours if slots are not wanted
    if (!slots) {
      return [{
        items: filteredTextAssignments
      }]
    }

    return slotifyAssignments(timeZone, filteredTextAssignments, slots)
  })

  // FIXME: We must also listen for 'core/planning-item+meta' to catch status changes
  useRepositoryEvents('core/planning-item', (event) => {
    if (event.event !== 'document') {
      return
    }

    if (!Array.isArray(data)) {
      return void mutate()
    }

    for (const slot of data) {
      const assignment = slot.items.find((assignment) => assignment._id === event.uuid)
      if (assignment) {
        console.log('Event affects assignment', event, assignment)
        void mutate()
        return
      }
    }
  })

  return data || []
}

/**
 * Check that the assignment is valid and
 */
function isValidAssignment(assignmentMeta: Block, type: string | undefined) {
  if (assignmentMeta.type !== 'core/assignment') {
    return false
  }

  // If type is given, filter out anything but type (e.g. text, picture...)
  if (type && !assignmentMeta.meta.filter((m) => m.type === 'core/assignment-type' && m.value === type)?.length) {
    return false
  }

  return true
}


/**
 * Get query
 */
function getQuery(date: Date | string) {
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)

  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(today)
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(today)
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(today)

  const hour = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h23' }).format(today).padStart(2, '0')
  const minute = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(today).padStart(2, '0')
  const second = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(today).padStart(2, '0')

  const formattedDate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'term',
              term: {
                field: 'document.meta.core_assignment.data.start_date',
                value: formattedDate
              }
            }
          },
          {
            conditions: {
              oneofKind: 'term',
              term: {
                field: 'document.meta.core_planning_item.data.start_date',
                value: formattedDate
              }
            }
          }
        ]
      })
    }
  })
}

/**
 * Extract assignments of the give type from the planning document
 */
function getAssignments(document: Document, type?: string): AssignmentInterface[] {
  const { meta, links } = document
  const assignments: AssignmentInterface[] = []

  // Loop over all meta elements to find assignments
  meta?.forEach((assignmentMeta) => {
    if (!isValidAssignment(assignmentMeta, type)) {
      return
    }

    // Collect all deliverable uuids
    const _deliverableId = assignmentMeta.links.find((l) => l.rel === 'deliverable')?.uuid

    assignments.push({
      _id: document.uuid,
      _title: document.title,
      _newsvalue: meta?.find((assignmentMeta) => assignmentMeta.type === 'core/newsvalue')?.value,
      _section: links.find((l) => l.type === 'core/section')?.title,
      _deliverableId: _deliverableId || '',
      ...assignmentMeta
    })
  })

  return assignments
}


/**
 * Split the assignments into the different time slots
 */
function slotifyAssignments(
  timeZone: string,
  assignments: AssignmentInterface[],
  slots: {
    key: string
    label: string
    hours: number[]
  }[]
): AssignmentResponseInterface[] {
  const response = slots.map((slot) => {
    return {
      ...slot,
      items: [] as AssignmentInterface[]
    }
  })

  assignments.forEach((assignment) => {
    let hour: number

    if (assignment.data.publish) {
      hour = getHours(toZonedTime(parseISO(assignment.data.publish), timeZone))
    } else if (assignment.data.publish_slot) {
      hour = parseInt(assignment.data.publish_slot)
    }

    response.forEach((slot) => {
      if (!hour && !slot.hours.length) {
        slot.items.push(assignment)
      } else if (hour && slot.hours.includes(hour)) {
        slot.items.push(assignment)
      }
    })
  }, [])

  return response
}
