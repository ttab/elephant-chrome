import { z } from 'zod'
import { BaseSchema } from './base'

const SectionSchema = z.object({
  _source: z.object({
    'document.meta.core_definition.data.text': z.array(z.string()),
    'document.meta.core_definition.role': z.array(z.string()),
    'document.meta.core_section.data.code': z.array(z.string())
  })
})

const _FullStorySchema = BaseSchema.and(SectionSchema)
export type IndexedSection = z.infer<typeof _FullStorySchema>
