import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const fields = [
  'document.rel.source.uri',
  'modified',
  'document.meta.core_newsvalue.value',
  'document.title',
  'document.meta.tt_wire.role',
  'document.rel.section.uuid',
  'document.rel.section.title',
  'current_version',
  'heads.saved.version',
  'heads.saved.created',
  'heads.read.version',
  'heads.read.created',
  'heads.used.version',
  'heads.used.created',
  'heads.flash.version',
  'heads.flash.created'
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
export type WireFields = z.infer<typeof schema>

/**
 * Interface extending HitV1 with a fields property of type WireSchema.
 */
export interface Wire extends HitV1 {
  fields: WireFields
}
