import type { QueryParams } from '@/hooks/useQuery'
import { SortingV1 } from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/timelessArticle'

export const timelessParams = (_filter: QueryParams) => ({
  documentType: 'core/article#timeless',
  fields,
  sort: [
    SortingV1.create({ field: 'modified', desc: true }),
    SortingV1.create({ field: 'document.title.sort', desc: false })
  ]
})
