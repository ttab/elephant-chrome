import { z } from 'zod'
import { BaseSchema } from './base'

const TimelessCategorySchema = z.object({
  _source: z.object({
    'document.rel.same_as.data.id': z.array(z.string()),
    'document.rel.same_as.type': z.array(z.string()),
    'document.rel.same_as.uri': z.array(z.string())
  })
})

const _FullTimelessCategorySchema = BaseSchema.and(TimelessCategorySchema)
export type IndexedTimelessCategory = z.infer<typeof _FullTimelessCategorySchema>
