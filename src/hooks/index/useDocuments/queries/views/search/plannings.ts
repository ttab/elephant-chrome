import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, TermsQueryV1, MultiMatchQueryV1, SortingV1, RangeQueryV1 } from '@ttab/elephant-api/index'
import { fields } from '../../../schemas/planning'

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

  if (filter.author) {
    addCondition('document.meta.core_assignment.rel.assignee.uuid', filter.author)
  }

  if (filter.aType) {
    addCondition('document.meta.core_assignment.meta.core_assignment_type.value', filter.aType)
  }

  if (filter.query) {
    boolConditions.must.push(
      {
        conditions: {
          oneofKind: 'multiMatch',
          multiMatch: MultiMatchQueryV1.create({
            fields: [
              'document.title',
              'document.meta.core_assignment.title',
              'document.meta.core_description.data.text',
              'document.meta.tt_slugline.value'
            ],
            query: filter.query.toString(),
            type: 'phrase_prefix'
          })
        }
      })
  }

  if (filter.from) {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'range',
        range: RangeQueryV1.create({
          field: 'document.meta.core_planning_item.data.start_date',
          gte: filter.from as string
        })
      }
    })
  }

  // No other filters than type and query, and query is empty, do a matchAll
  if (Object.keys(filter).every((key) => {
    if (key === 'type') {
      return true
    }

    if (key === 'query') {
      return !filter.query
    }

    return false
  })
  ) {
    return QueryV1.create({
      conditions: {
        oneofKind: 'matchAll',
        matchAll: {}
      }
    })
  }


  return query
}

const dateGroupKey = 'document.meta.core_planning_item.data.start_date'

const params = (filter: QueryParams) => ({
  documentType: 'core/planning-item',
  fields,
  sort: [
    SortingV1.create({ field: 'document.meta.core_planning_item.data.start_date', desc: !filter.from }),
    SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true })
  ],
  query: constructQuery(filter)
})

export default {
  dateGroupKey,
  params
}
