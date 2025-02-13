import { DocumentStatuses } from '@/defaults/documentStatuses'
import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { QueryV1, BoolQueryV1 } from '@ttab/elephant-api/index'
import type { BulkGetResponse, GetStatusOverviewResponse, StatusOverviewItem } from '@ttab/elephant-api/repository'
import type { Session } from 'next-auth'
import { parseISO } from 'date-fns'
import { getStatus } from '../getStatus'
import { getAssignmentsFromDocument } from './getAssignmentsFromDocument'
import type { AssignmentInterface } from './types'


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
export async function fetchAssignments({ index, repository, type, requireDeliverable = false, session, date }: {
  index: Index | undefined
  repository: Repository | undefined
  type?: string
  requireDeliverable?: boolean
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
      query: constructQuery(date)
    })

    if (!ok) {
      throw new Error(errorMessage || 'Unknown error while searching for text assignments')
    }

    // Collect all assignments and deliverable uuids for this result page
    const uuids: string[] = []
    for (const { document } of hits) {
      if (document) {
        for (const assignment of getAssignmentsFromDocument(document, type)) {
          if (!requireDeliverable || assignment._deliverableId) {
            assignments.push(assignment)
          }

          if (assignment._deliverableId) {
            uuids.push(assignment._deliverableId)
          }
        }
      }
    }

    // If we found deliverable uuids we want to fetch statuses and the deliverable documents
    if (uuids.length > 0 && repository) {
      // Initialize a getStatuses request for this result page
      const [documentsRequest, statusesRequest] = getRelatedDocuments(repository, session.accessToken, uuids)

      if (documentsRequest instanceof Promise) {
        deliverableDocumentsRequests.push(documentsRequest)
      }

      if (statusesRequest instanceof Promise) {
        deliverableStatusesRequests.push(statusesRequest)
      }
    }

    page = hits?.length === size ? page + 1 : 0
  } while (page)


  const filteredTextAssignments: AssignmentInterface[] = []

  // Wait for all statuses requests to finish and extract all status overviews
  const statusOverviews = (await Promise.all(deliverableStatusesRequests)).reduce((prev, curr) => {
    return [...prev || [], ...curr?.items || []]
  }, [] as StatusOverviewItem[])

  // Apply status to all assignments
  assignments.forEach((assignment) => {
    const statusOverview = statusOverviews.find((si) => si.uuid === assignment._deliverableId)
    filteredTextAssignments.push({
      ...assignment,
      _deliverableStatus: getStatus(statusOverview),
      _statusData: (statusOverview) ? JSON.stringify(statusOverview, (_, val) => { return typeof val === 'bigint' ? val.toString() : val as unknown }, 2) : undefined
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


  // Sort assignments with fullday first, then in time order
  filteredTextAssignments.sort((a, b) => {
    const at = a.data.publish ? parseISO(a.data.publish) : 0
    const bt = b.data.publish ? parseISO(b.data.publish) : 0

    return bt.valueOf() - at.valueOf()
  })

  return filteredTextAssignments
}


/**
 * Get query
 *
 * @param date - The date to format for the query.
 * @returns The formatted query object.
 */
function constructQuery(date: Date | string): QueryV1 {
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
 * Fetch documents and status documents for the given uuids from the repository
 *
 * @param repository {Repository}
 * @param accessToken {string}
 * @param uuids {string[]}
 *
 * @returns [Promise<BulkGetResponse | null>, Promise<GetStatusOverviewResponse | null]
 */
function getRelatedDocuments(repository: Repository, accessToken: string, uuids: string[]): [Promise<BulkGetResponse | null>, Promise<GetStatusOverviewResponse | null>] {
  // Initialize a getDocuments request for this result page
  const documentsRequest = repository.getDocuments({
    uuids,
    accessToken
  })

  // Initialize a getStatuses request for this result page
  const statusesRequest = repository.getStatuses({
    uuids,
    statuses: knownStatuses,
    accessToken
  })


  return [documentsRequest, statusesRequest]
}
