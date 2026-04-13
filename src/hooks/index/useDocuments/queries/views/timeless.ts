import type { QueryParams } from '@/hooks/useQuery'
import { getSystemLanguage } from '@/shared/getSystemLanguage'
import {
  QueryV1,
  BoolQueryV1,
  TermsQueryV1,
  MultiMatchQueryV1,
  SortingV1
} from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/timelessArticle'

function constructQuery(filter: QueryParams | undefined): QueryV1 | undefined {
  if (!filter) {
    return QueryV1.create({
      conditions: {
        oneofKind: 'matchAll',
        matchAll: {}
      }
    })
  }

  const systemLanguage = getSystemLanguage()

  const query = QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({
        must: [
          {
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'document.language',
                values: [systemLanguage, systemLanguage.split('-')[0]]
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

  if (filter.category) {
    addCondition('document.rel.subject.uuid', filter.category)
  }

  if (filter.query) {
    boolConditions.must.push({
      conditions: {
        oneofKind: 'multiMatch',
        multiMatch: MultiMatchQueryV1.create({
          fields: [
            'document.title',
            'document.rel.subject.title',
            'text'
          ],
          query: filter.query.toString(),
          type: 'phrase_prefix'
        })
      }
    })
  }

  if (Object.keys(filter).every((key) => key === 'type' || (key === 'query' && !filter.query))) {
    return QueryV1.create({
      conditions: {
        oneofKind: 'matchAll',
        matchAll: {}
      }
    })
  }

  return query
}

export const timelessParams = (filter: QueryParams) => ({
  documentType: 'core/article#timeless',
  fields,
  query: constructQuery(filter),
  sort: [
    SortingV1.create({ field: 'modified', desc: true }),
    SortingV1.create({ field: 'document.title.sort', desc: false })
  ]
})
