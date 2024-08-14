import { type z } from 'zod'
import { type BaseSchema } from './base'

export type IndexedSection = z.infer<typeof BaseSchema>
