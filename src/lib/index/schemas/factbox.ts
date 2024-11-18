import { z } from 'zod'

const _FactboxSchema = z.object({
  _id: z.string(),
  _index: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.content.core_text.data.text': z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.array(z.string())
  })
})

export type Factbox = z.infer<typeof _FactboxSchema>
