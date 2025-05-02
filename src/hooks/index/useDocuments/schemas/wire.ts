import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
const _fields = [
  'document.rel.source.uri',
  'document.rel.provider.uri',
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
  'heads.flash.created',
  'current_version'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for wires.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the wiresSchema.
 */
export type WireFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type WireFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type WireSchema.
 */
export interface Wire extends HitV1 {
  fields: WireFieldsObject
}

/**
 * Export fields and cast it as PlanningFields
 */
export const fields = _fields as unknown as WireFields
