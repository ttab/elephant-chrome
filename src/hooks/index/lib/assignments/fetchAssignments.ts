import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { QueryV1, BoolQueryV1, TermQueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'
import type { DocumentMetrics, StatusOverviewItem } from '@ttab/elephant-api/repository'
import { type BulkGetResponse, type GetMetricsResponse, type GetStatusOverviewResponse } from '@ttab/elephant-api/repository'
import type { Session } from 'next-auth'
import { parseISO } from 'date-fns'
import { getStatus } from '../getStatus'
import { getAssignmentsFromDocument } from './getAssignmentsFromDocument'
import type { AssignmentInterface } from './types'
import { StatusSpecifications } from '@/defaults/workflowSpecification'
import { getUTCDateRange } from '@/lib/datetime'
import { format } from 'date-fns'


// We want to fetch all known statuses for deliverables and then
// filter them using the supplied "statuses" prop.
const knownStatuses = Object.keys(StatusSpecifications)

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
export async function fetchAssignments({ index, repository, type, requireDeliverable, requireMetrics, session, date, timeZone, dateType = 'start-date' }: {
  index: Index | undefined
  repository: Repository | undefined
  type?: string | string[]
  requireDeliverable?: boolean
  requireMetrics?: string[] | null
  session: Session | null
  date: Date
  timeZone: string
  dateType?: 'start-date' | 'publish'
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
  const metricsDocumentsRequests: Promise<GetMetricsResponse | null>[] = []

  do {
    const query = constructQuery(date, dateType, timeZone)
    console.log(JSON.stringify(query, null, 2))

    const { ok, hits, errorMessage } = await index.query({
      accessToken: session.accessToken,
      documentType: 'core/planning-item',
      page,
      size,
      loadDocument: true,
      query
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


    // if metrics are required, fetch them
    if (requireMetrics?.length && uuids.length > 0 && repository) {
      const metricsRequest = repository.getMetrics(uuids, requireMetrics, session.accessToken)
      if (metricsRequest instanceof Promise) {
        metricsDocumentsRequests.push(metricsRequest)
      }
    }

    page = hits?.length === size ? page + 1 : 0
  } while (page)


  const filteredTextAssignments: AssignmentInterface[] = []

  // Wait for all statuses requests to finish and extract all status overviews
  const statusOverviews = (await Promise.all(deliverableStatusesRequests))
    .reduce<StatusOverviewItem[]>((prev, curr) => {
      return [...prev || [], ...curr?.items || []]
    }, [])


  const metricsOverviews = (await Promise.all(metricsDocumentsRequests))
    .reduce<Record<string, DocumentMetrics>>((prev, curr) => {
      return { ...prev, ...curr?.documents }
    }, {})

  // Apply status to all assignments
  assignments.forEach((assignment) => {
    const statusOverview = statusOverviews.find((si) => si.uuid === assignment._deliverableId)
    const charCount = metricsOverviews[assignment._deliverableId]?.metrics
      .find((metric) => metric.kind === 'charcount')?.value.toString() || undefined

    filteredTextAssignments.push({
      ...assignment,
      _deliverableStatus: getStatus(statusOverview),
      _statusData: statusOverview
        ? JSON.stringify(statusOverview, (_, val) => (
          typeof val === 'bigint' ? val.toString() : val as unknown), 2)
        : undefined,
      _metricsData: {
        charCount
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
 * @param date - The local date to format for the query.
 * @returns The formatted query object.
 */
function constructQuery(
  date: Date,
  dateType: 'start-date' | 'publish',
  timeZone: string
): QueryV1 {
  const { from, to } = getUTCDateRange(date, timeZone)
  const formattedDate = format(date, 'yyyy-MM-dd\'T00:00:000Z\'')

  if (dateType === 'publish') {
    return QueryV1.create({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'document.meta.core_assignment.data.publish',
          gte: `${from}`,
          lte: `${to}`
        })
      }
    })
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'term',
              term: TermQueryV1.create({
                field: 'document.meta.core_assignment.data.start_date',
                value: formattedDate
              })
            }
          },
          {
            conditions: {
              oneofKind: 'term',
              term: TermQueryV1.create({
                field: 'document.meta.core_planning_item.data.start_date',
                value: formattedDate
              })
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
