import { type z } from 'zod'
import { type BaseSchema } from './base'

export type IndexedWireSource = z.infer<typeof BaseSchema>
