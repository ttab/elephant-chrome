import type { QueryParams } from '@/hooks/useQuery'
import { QueryV1, BoolQueryV1, MultiMatchQueryV1 } from '@ttab/elephant-api/index'
import { buildAdvancedQuery } from '@/components/AdvancedSearch/lib/buildQuery'
import { deserializeAdvancedState, hasAdvancedParams } from '@/components/AdvancedSearch/hooks/useAdvancedSearchParams'
import { factboxFields, dateFields } from '@/components/AdvancedSearch/configs'

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

  if (hasAdvancedParams(filter)) {
    const advQuery = buildAdvancedQuery(deserializeAdvancedState(filter, factboxFields), factboxFields, dateFields.factboxes)
    if (advQuery) {
      boolConditions.must.push(advQuery)
    }
  } else if (filter.query) {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'multiMatch',
        multiMatch: MultiMatchQueryV1.create({
          fields: ['document.title', 'document.content.core_text.data.text'],
          query: filter.query.toString(),
          type: 'phrase_prefix'
        })
      }
    })
  }

  return query
}
