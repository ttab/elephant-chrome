import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const fields = [
  'document.title',
  'document.meta.tt_print_article.title',
  'document.rel.flow.*',
  'document.meta.tt_print_article.data.date'
]

/**
 * Create a schema based on fields array.
 */
const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<string, z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for print articles.
 */
export const schema = z.object(schemaShape)

/**
 * Type inferred from the print articles schema.
 */
export type PrintArticleFields = z.infer<typeof schema>

/**
 * Interface extending HitV1 with a fields property of type PrintArticleFields.
 */
export interface PrintArticle extends HitV1 {
  fields: PrintArticleFields
}
