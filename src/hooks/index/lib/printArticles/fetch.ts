import type { Index } from '@/shared/Index'
import type { Repository } from '@/shared/Repository'
import { BoolQueryV1, MultiMatchQueryV1, QueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import type { PrintArticle } from '.'
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
export async function fetch({ index, session, filter, page = 1 }: {
  index: Index | undefined
  repository: Repository | undefined
  session: Session | null
  page?: number
  filter?: QueryParams
}): Promise<PrintArticle[] | undefined> {
  if (!index || !session?.accessToken) {
    return undefined
  }

  const size = 10

  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'core/article',
    page,
    size,
    sort: [{ field: 'modified', desc: true }],
    fields,
    query: constructQuery(filter)
  })

  if (!ok) {
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
  if (!filter) {
    return
  }

  const query = QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: []
      })
    }
  })

  if (query.conditions.oneofKind !== 'bool') {
    return
  }

  const boolConditions = query.conditions.bool

  const addCondition = (field: string, values: string | string[]) => {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'terms',
        terms: TermsQueryV1.create({
          field,
          values: typeof values === 'string' ? [values] : values
        })
      }
    })
  }

  if (filter.section) {
    addCondition('document.rel.section.uuid', filter.section)
  }

  if (filter.source) {
    addCondition('document.rel.source.uri', filter.source)
  }

  if (filter.newsvalue) {
    addCondition('document.meta.core_newsvalue.value', filter.newsvalue)
  }

  if (filter.query) {
    boolConditions.must.push(
      {
        conditions: {
          oneofKind: 'multiMatch',
          multiMatch: MultiMatchQueryV1.create({
            fields: ['document.title', 'document.rel.section.title'],
            query: filter.query[0],
            type: 'phrase_prefix'
          })
        }
      })
  }

  return query
}
