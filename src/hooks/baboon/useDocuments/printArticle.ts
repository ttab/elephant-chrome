import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {QueryParams | undefined} filter - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(filter: QueryParams | undefined): QueryV1 | undefined {
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
  if (filter.from) {
    addCondition('document.meta.tt_print_article.data.date', filter.from[0])
  }

  if (filter.printFlow) {
    addCondition('document.rel.flow.uuid', filter.printFlow)
  }

  if (filter.workflowState) {
    addCondition('workflow_state', filter.workflowState)
  }

  return query
}
