import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'
import type { Document } from '@ttab/elephant-api/newsdoc'

/**
 * List of fields used in the schema.
 */
const _fields = [
  'document.title',
  'document.start_time.value',
  'document.start_time.type',
  'document.meta.core_newsvalue.value',
  'document.meta.tt_slugline.value',
  'document.rel.section.uuid',
  'document.rel.section.title',
  'document.meta.core_assignment.title',
  'document.meta.core_assignment.id',
  'document.meta.core_assignment.rel.assignee.title',
  'document.meta.core_assignment.meta.core_assignment_type.value',
  'document.meta.core_assignment.rel.deliverable.uuid',
  'document.meta.core_assignment.data.start_date',
  'document.meta.core_assignment.data.end_date',
  'document.meta.core_assignment.data.start',
  'document.meta.core_assignment.data.end',
  'document.meta.core_assignment.data.full_day',
  /* 'document.meta.core_assignment.data.publish', dont think we need this */
  'document.meta.core_assignment.data.publish_slot',
  'document.meta.core_assignment.data.public',
  'document.meta.core_planning_item.data.start_date',
  'document.rel.event.uuid'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for assignment.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the assignmentSchema for document fields.
 */
export type AssignmentFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type AssignmentFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type AssignmentFields
 */
export interface Assignment extends HitV1 {
  fields: AssignmentFieldsObject
  document?: Document
}

/**
 * Export fields and cast it as AssignmentFields
 */
export const fields = _fields as unknown as AssignmentFields
