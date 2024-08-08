import { z } from 'zod'

const StorySchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.type': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string()),
    'heads.usable.created': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()),
    'heads.usable.id': z.array(z.string()),
    'heads.usable.version': z.array(z.string()),
    'document.meta.core_definition.data.text': z.array(z.string()),
    'document.meta.core_definition.role': z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.null()
  })
})

export type IndexedStory = z.infer<typeof StorySchema>
