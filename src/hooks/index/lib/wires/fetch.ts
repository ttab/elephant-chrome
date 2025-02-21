import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { BoolQueryV1, QueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { Wire } from '.'
import { fields } from '.'

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
export async function fetch({ index, session, source, page = 1 }: {
  index: Index | undefined
  repository: Repository | undefined
  session: Session | null
  page?: number
  source?: string[]
}): Promise<Wire[] | undefined> {
  if (!index || !session?.accessToken) {
    return undefined
  }

  const size = 40

  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'tt/wire',
    page,
    size,
    sort: [{ field: 'modified', desc: true }],
    fields,
    query: constructQuery(source)
  })

  if (!ok) {
    throw new Error(errorMessage || 'Unknown error while searching for text assignments')
  }

  return hits
}

/**
 * Constructs a query object from the given source array.
 *
 * @param {string[] | undefined} source - The source array to construct the query from.
 * @returns {QueryV1 | undefined} The constructed query object or undefined if the source is undefined.
 */
function constructQuery(source: string[] | undefined): QueryV1 | undefined {
  if (!source || !source?.length) {
    return
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'document.rel.source.uri',
                values: source
              })
            }
          }
        ]
      })
    }
  })
}
