import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
const _fields = [
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
  'heads.usable.version',
  'heads.done.created',
  'heads.approved.created',
  'heads.withheld.created'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for plannings.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the planningSchema for document fields.
 */
export type PlanningFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type PlanningFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type PlanningFields
 */
export interface Planning extends HitV1 {
  fields: PlanningFieldsObject
}

/**
 * Export fields and cast it as PlanningFields
 */
export const fields = _fields as unknown as PlanningFields
