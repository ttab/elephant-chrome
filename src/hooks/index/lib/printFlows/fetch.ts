import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { QueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { PrintFlow } from '.'
import { fields } from '.'
import type { QueryParams } from '@/hooks/useQuery'

/**
 * Fetches wires from the index based on the provided parameters.
 *
 * @param {Object} params - The parameters for fetching wires.
 * @param {Index | undefined} params.index - The index to query.
 * @param {Repository | undefined} params.repository - The repository to query.
 * @param {Session | null} params.session - The session containing the access token.
 * @param {number} [params.page=1] - The page number to fetch.
 * @param {string[]} [params.source] - The source array to construct the query from.
 * @returns {Promise<Wire[] | undefined>} A promise that resolves to an array of wires or undefined.
 */
export async function fetch({ index, session, filter }: {
  index: Index | undefined
  repository: Repository | undefined
  session: Session | null
  page?: number
  filter?: QueryParams
}): Promise<PrintFlow[] | undefined> {
  if (!session?.accessToken) {
    return undefined
  }
  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'tt/print-flow',
    fields,
    query: constructQuery(filter)
  })

  if (!ok) {
    console.error('fetch tt/print-flow error', errorMessage)
    throw new Error(errorMessage || 'Unknown error while searching for text assignments')
  }
  return hits
}

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
function constructQuery(filter: QueryParams | undefined): QueryV1 | undefined {
  const query = QueryV1.create({
    conditions: {
      oneofKind: 'matchAll',
      matchAll: {}
    }
  })

  return query
}
