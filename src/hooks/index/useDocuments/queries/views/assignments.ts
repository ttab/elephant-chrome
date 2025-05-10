import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(filter: QueryParams | undefined): QueryV1 | undefined {
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

  if (filter?.from && filter?.to) {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'document.meta.core_assignment.data.start_date',
          gte: `${filter.from.toString()}`,
          lte: `${filter.to.toString()}`
        })
      }
    })
  }

  return query
}
