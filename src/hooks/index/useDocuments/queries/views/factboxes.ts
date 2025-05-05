import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, MultiMatchQueryV1 } from '@ttab/elephant-api/index'

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(filter: QueryParams | undefined): QueryV1 | undefined {
  if (!filter) {
    return undefined
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
    return undefined
  }

  const boolConditions = query.conditions.bool

  if (filter.query) {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'multiMatch',
        multiMatch: MultiMatchQueryV1.create({
          fields: ['document.title', 'document.content.core_text.data.text'],
          query: filter.query[0],
          type: 'phrase_prefix'
        })
      }
    })
  }

  return query
}
