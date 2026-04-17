import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields available in the core/article#timeless index.
 */
export const _fields = [
  'document.title',
  'workflow_state',
  'document.rel.subject.uuid',
  'document.rel.subject.title',
  'created',
  'modified'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for timeless articles.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from fields
 */
export type TimelessArticleFields = readonly (typeof _fields)[number][]

/**
 * Type inferred from the schema.
 */
type TimelessArticleFieldsObject = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property.
 */
export interface TimelessArticle extends HitV1 {
  fields: TimelessArticleFieldsObject
}

/**
 * Export fields
 */
export const fields: TimelessArticleFields = _fields
