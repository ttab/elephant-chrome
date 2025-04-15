import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const fields = [
  'document.title',
  'document.content.tt_print_content.name',
  'document.content.tt_print_content.title'
]

/**
 * Create a schema based on fields array.
 */
const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<string, z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for wires.
 */
export const schema = z.object(schemaShape)

/**
 * Type inferred from the wiresSchema.
 */
export type PrintFlowFields = z.infer<typeof schema>

/**
 * Interface extending HitV1 with a fields property of type WireSchema.
 */
export interface PrintFlow extends HitV1 {
  fields: PrintFlowFields
}
