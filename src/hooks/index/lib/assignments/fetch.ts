import { DocumentStatuses } from '@/defaults/documentStatuses'
import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { QueryV1, BoolQueryV1 } from '@ttab/elephant-api/index'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { BulkGetResponse, GetStatusOverviewResponse } from '@ttab/elephant-api/repository'
import type { Session } from 'next-auth'
import { parseISO } from 'date-fns'

export interface AssignmentInterface extends Block {
  _id: string
  _deliverableId: string
  _deliverableStatus?: string
  _deliverableDocument?: Document
  _title: string
  _newsvalue?: string
  _section?: string
  _statusData?: string
}

// We want to fetch all known statuses for deliverables and then
// filter them using the supplied "statuses" prop.
const knownStatuses = DocumentStatuses.map((status) => status.value)

/**
 * Fetches assignments from the index and augments them with deliverable statuses
 * and documents from the repository.
 *
 * @param {Object} params - The parameters for fetching assignments.
 * @param {Index | undefined} params.index - The index to query.
 * @param {Repository | undefined} params.repository - The repository to query.
 * @param {string | undefined} [params.type] - The type of assignments to fetch.
 * @param {Session | null} params.session - The session containing the access token.
 * @param {Date | string} params.date - The date to filter assignments by.
 * @returns {Promise<AssignmentInterface[] | undefined>} - The fetched assignments or undefined if index or session is not provided.
 */
async function fetchAssignments({ index, repository, type, session, date }: {
  index: Index | undefined
  repository: Repository | undefined
  type?: string
  session: Session | null
  date: Date | string
}
): Promise<AssignmentInterface[] | undefined> {
  if (!index || !session?.accessToken) {
    return undefined
  }

  const size = 100
  let page = 1
  const assignments: AssignmentInterface[] = []
  const deliverableStatusesRequests: Promise<GetStatusOverviewResponse | null>[] = []
  const deliverableDocumentsRequests: Promise<BulkGetResponse | null>[] = []

  do {
    const { ok, hits, errorMessage } = await index.query({
      accessToken: session.accessToken,
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
      accessToken: session.accessToken
    })
    if (statusRequest) {
      deliverableStatusesRequests.push(statusRequest)
    }

    // Initialize a getDocuments request for this result page
    const documentsRequest = repository?.getDocuments({
      uuids,
      accessToken: session.accessToken
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
      const status = Object.keys(itemStatuses.heads).length > 0 && Object.keys(itemStatuses.heads).reduce((prevStatus, currStatus) => {
        if (!prevStatus) {
          return currStatus
        }
        if ((itemStatuses.heads[currStatus].version < 0)) {
          return 'draft'
        }
        if ((itemStatuses.heads[currStatus].version > 0 && itemStatuses.heads[currStatus].version > itemStatuses.heads[prevStatus].version)) {
          return currStatus
        } else {
          return prevStatus
        }
      }, '') || 'draft' // Default to draft (empty status)

      const t = assignments.find((t) => t._deliverableId == itemStatuses.uuid)
      if (t) {
        filteredTextAssignments.push({
          ...t,
          _deliverableStatus: status,
          _statusData: JSON.stringify(itemStatuses, (_, val) => { return typeof val === 'bigint' ? val.toString() : val as unknown }, 2)
        })
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

  return filteredTextAssignments
}

/**
 * Check that the assignment is valid and matches the given type.
 *
 * @param assignmentMeta - The metadata of the assignment to check.
 * @param type - The type to filter assignments by (e.g. text, picture).
 * @returns - Returns true if the assignment is valid and matches the given type, otherwise false.
 */
function isValidAssignment(assignmentMeta: Block, type: string | undefined): boolean {
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
 *
 * @param date - The date to format for the query.
 * @returns The formatted query object.
 */
function getQuery(date: Date | string): QueryV1 {
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
 * Extract assignments of the given type from the planning document
 *
 * @param document - The planning document to extract assignments from.
 * @param type - The type of assignments to extract.
 * @returns An array of assignments matching the given type.
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

export default fetchAssignments
