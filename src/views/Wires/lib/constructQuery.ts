import { QueryV1, BoolQueryV1, TermsQueryV1, MultiMatchQueryV1 } from '@ttab/elephant-api/index'
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
