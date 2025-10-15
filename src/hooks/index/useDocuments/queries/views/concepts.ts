import type { QueryParams } from '@/hooks/useQuery'
import { BoolQueryV1, QueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(filter?: QueryParams): QueryV1 | undefined {
  if (!filter) {
    return undefined
  }
  const query = QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'range',
              range: RangeQueryV1.create({
                gte: '1',
                field: 'heads.usable.version'
              })
            }
          }
        ]
      })
    }
  })

  return query
}
