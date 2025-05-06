import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, TermsQueryV1, MultiMatchQueryV1 } from '@ttab/elephant-api/index'

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
            query: filter.query.toString(),
            type: 'phrase_prefix'
          })
        }
      })
  }

  return query
}
