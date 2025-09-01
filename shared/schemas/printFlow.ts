import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
const _fields = [
  'document.title',
  'document.content.tt_print_content.name',
  'document.content.tt_print_content.title'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for print flows.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the printFlowsSchema for document fields.
 */
export type PrintFlowFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type PrintFlowFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type PrintArticlesFields
 */
export interface PrintFlow extends HitV1 {
  fields: PrintFlowFieldsObject
}

/**
 * Export fields and cast it as PrintFlowFields
 */
export const fields = _fields as unknown as PrintFlowFields
