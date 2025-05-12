import { type z } from 'zod'
import { type BaseSchema } from './base'

export type IndexedEditorialInfoType = z.infer<typeof BaseSchema>
