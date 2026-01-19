import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const _baseConceptFields = [
  'document.title',
  'heads.usable.version',
  'current_version',
  'heads.usable.id'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _baseConceptFields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _baseConceptFields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for BaseConcept.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the BaseConceptSchema.
 */
export type BaseConceptFieldsObject = z.infer<typeof _schema>

export type BaseConceptFields = Array<keyof typeof _baseConceptFields>

/**
 * Interface extending HitV1 with a fields property of type BaseConceptFields
 */
export interface Concept extends HitV1 {
  fields: BaseConceptFieldsObject
}

/**
 * Export fields and cast it as BaseConceptFields
 */
export const fields = _baseConceptFields as unknown as BaseConceptFields
