import { type z } from 'zod'
import { type BaseSchema } from './base'

export type IndexedContentSource = z.infer<typeof BaseSchema>
