import {
  BoolQueryV1,
  QueryV1,
  SortingV1,
  TermsQueryV1
} from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/timelessArticle'

const DEFAULT_STATUSES = ['draft', 'done'] as const

export const timelessParams = (status: readonly string[] | undefined) => {
  const values = status && status.length > 0
    ? [...status]
    : [...DEFAULT_STATUSES]

  return {
    documentType: 'core/article#timeless',
    fields,
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'workflow_state',
                values
              })
            }
          }]
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'modified', desc: true }),
      SortingV1.create({ field: 'document.title.sort', desc: false })
    ]
  }
}
