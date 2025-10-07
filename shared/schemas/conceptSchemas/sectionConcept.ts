import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'
import { _baseConceptFields } from './baseConcept'

/**
 * List of fields used in the schema.
 */
const _fields = [
  ..._baseConceptFields,
  'document.meta.data.code'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for SectionConcept.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the SectionConceptSchema.
 */
export type SectionConceptFields = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property of type SectionConceptFields
 */
export interface SectionConcept extends HitV1 {
  fields: SectionConceptFields
}

/**
 * Export fields and cast it as SectionConceptFields
 */
export const fields = _fields as unknown as SectionConceptFields
