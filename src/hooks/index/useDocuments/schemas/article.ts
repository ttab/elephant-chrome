import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const fields = [
  'document.title',
  'document.meta.status',
  'document.meta.core_newsvalue.value',
  'document.meta.tt_slugline.value',
  'document.rel.section.uuid',
  'document.rel.section.title',
  'document.meta.core_assignment.rel.assignee.title',
  'document.meta.core_assignment.meta.core_assignment_type.value',
  'document.meta.core_assignment.rel.deliverable.uuid',
  'document.meta.core_planning_item.data.start_date',
  'document.rel.event.uuid',
  'heads.usable.created',
  'heads.done.created',
  'heads.approved.created',
  'heads.withheld.created'
]

/**
 * Create a schema based on fields array.
 */
type FieldKeys = typeof fields[number] // Union type of all field strings

const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<FieldKeys, z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for wires.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the articlesSchema.
 */
type ArticleFields = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property of type articlesSchema.
 */
export interface Article extends HitV1 {
  fields: ArticleFields
}
