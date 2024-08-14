import { z } from 'zod'
import { BaseSchema } from './base'

const StorySchema = z.object({
  _source: z.object({
    'document.meta.core_definition.data.text': z.array(z.string()),
    'document.meta.core_definition.role': z.array(z.string())
  })
})

const FullStorySchema = BaseSchema.and(StorySchema)
export type IndexedStory = z.infer<typeof FullStorySchema>
