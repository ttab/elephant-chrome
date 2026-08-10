import {
  BoolQueryV1,
  MultiMatchQueryV1,
  QueryV1,
  SortingV1,
  TermsQueryV1
} from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/timelessArticle'

const DEFAULT_STATUSES = ['draft', 'done'] as const

/**
 * Fields the free text search matches against. `text` is the only body text
 * field in the core/article#timeless mapping - the index holds no
 * `document.content.*` fields for this document type. It is searchable but not
 * retrievable, so the inline text can only ever be matched by the index, never
 * by a client side filter.
 */
const FREE_TEXT_FIELDS = ['document.title', 'text']

export const timelessParams = (
  status: readonly string[] | undefined,
  query?: string
) => {
  const values = status && status.length > 0
    ? [...status]
    : [...DEFAULT_STATUSES]

  const must: QueryV1[] = [{
    conditions: {
      oneofKind: 'terms',
      terms: TermsQueryV1.create({
        field: 'workflow_state',
        values
      })
    }
  }]

  if (query) {
    must.push({
      conditions: {
        oneofKind: 'multiMatch',
        multiMatch: MultiMatchQueryV1.create({
          fields: FREE_TEXT_FIELDS,
          query,
          type: 'phrase_prefix'
        })
      }
    })
  }

  return {
    documentType: 'core/article#timeless',
    fields,
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({ must })
      }
    }),
    sort: [
      SortingV1.create({ field: 'modified', desc: true }),
      SortingV1.create({ field: 'document.title.sort', desc: false })
    ]
  }
}
