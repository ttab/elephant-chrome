import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
export const _fields = [
  'document.title',
  'document.meta.status',
  'document.meta.core_event.data.start',
  'document.meta.core_event.data.end',
  'document.meta.core_event.data.cancelled',
  'document.meta.core_newsvalue.value',
  'document.meta.tt_slugline.value',
  'document.rel.organiser.title',
  'document.rel.section.uuid',
  'document.rel.section.title',
  'heads.usable.created',
  'heads.usable.version',
  'heads.done.created',
  'heads.approved.created',
  'heads.withheld.created',
  'heads.cancelled.created'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for events.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the eventSchema.
 */
type EventFieldsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type EventFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type EventFields.
 */
export interface Event extends HitV1 {
  fields: EventFieldsObject
  _relatedPlannings: string
}

/**
 * Export fields and cast it as PlanningFields
 */
export const fields = _fields as unknown as EventFields
