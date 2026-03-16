import { QueryV1, BoolQueryV1, TermsQueryV1, MultiMatchQueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'
import type { WireFilter } from '../hooks/useWireViewState'

/**
 * Constructs a query object based on the provided filter parameters.
 *
 * @param {WireFilter[]} filters - The filter parameters to construct the query.
 * @returns {QueryV1 | undefined} - The constructed query object or undefined if no filter is provided.
 */
export function constructQuery(filters: WireFilter[]): QueryV1 | undefined {
  if (!filters.length) {
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

  filters.forEach((filter) => {
    if (filter.type === 'core/source') {
      addCondition('document.rel.source.uri', filter.values)
    } else if (filter.type === 'core/section') {
      addCondition('document.rel.section.uuid', filter.values)
    } else if (filter.type === 'core/newsvalue') {
      addCondition('document.meta.core_newsvalue.value', filter.values)
    } else if (filter.type === 'wireStatus') {
      // Hierarchy (highest to lowest): used > saved > read
      // Each status condition must include must-not exclusions for higher statuses
      const higherStatuses: Record<string, string[]> = {
        used: ['flash', 'saved', 'read'],
        flash: ['used', 'saved', 'read'],
        read: [],
        saved: []
      }

      const rangeGte1 = (status: string) => QueryV1.create({
        conditions: {
          oneofKind: 'range',
          range: RangeQueryV1.create({ field: `heads.${status}.version`, gte: '1' })
        }
      })

      const statusConditions = filter.values.map((status) => QueryV1.create({
        conditions: {
          oneofKind: 'bool',
          bool: BoolQueryV1.create({
            must: [rangeGte1(status)],
            mustNot: (higherStatuses[status] ?? []).map(rangeGte1)
          })
        }
      }))

      boolConditions.must.push(QueryV1.create({
        conditions: {
          oneofKind: 'bool',
          bool: BoolQueryV1.create({
            should: statusConditions,
            minimumShouldMatch: BigInt(1)
          })
        }
      }))
    } else if (filter.type === 'query') {
      // For query filters, we still need to iterate values since each needs a separate multiMatch
      filter.values.forEach((value) => {
        boolConditions.must.push({
          conditions: {
            oneofKind: 'multiMatch',
            multiMatch: MultiMatchQueryV1.create({
              fields: [
                'document.title',
                'document.content.core_text.data.text',
                'document.content.core_table.data.tbody',
                'document.content.core_table.data.thead',
                'document.content.core_table.data.tfoot',
                'document.content.core_table.data.caption',
                'document.content.core_ordered_list.content.core_text.data.text',
                'document.content.core_unordered_list.content.core_text.data.text'
              ],
              query: value.toString(),
              type: 'phrase_prefix'
            })
          }
        })
      })
    }
  })

  return query
}
