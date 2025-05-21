import { QueryV1, BoolQueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(flowId: string): QueryV1 | undefined {
  const query = QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'term',
              term: TermQueryV1.create({
                field: '_id',
                value: flowId
              })
            }
          }
        ]
      })
    }
  })

  if (query.conditions.oneofKind !== 'bool') {
    return
  }
  return query
}

export const fields = [
  'document.uri',
  'document.title',
  'document.content.tt_print_slot.name'
] as const

export type LayoutNameFields = typeof fields[number]
