import { z } from 'zod'
import { BaseSchema } from './base'

const CategorySchema = z.object({
  _source: z.object({
    'document.rel.same_as.data.id': z.array(z.string()),
    'document.rel.same_as.type': z.array(z.string()),
    'document.rel.same_as.uri': z.array(z.string())
  })
})

const FullCategorySchema = BaseSchema.and(CategorySchema)
export type IndexedCategory = z.infer<typeof FullCategorySchema>
