import type { QueryParams } from '@/hooks/useQuery'
import { getSystemLanguage } from '@/shared/getSystemLanguage'
import {
  QueryV1,
  BoolQueryV1,
  TermsQueryV1,
  SortingV1
} from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/timelessArticle'

function constructQuery(): QueryV1 {
  const systemLanguage = getSystemLanguage()

  return QueryV1.create({
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
}

export const timelessParams = (_filter: QueryParams) => ({
  documentType: 'core/article#timeless',
  fields,
  query: constructQuery(),
  sort: [
    SortingV1.create({ field: 'modified', desc: true }),
    SortingV1.create({ field: 'document.title.sort', desc: false })
  ]
})
