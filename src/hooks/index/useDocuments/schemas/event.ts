import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of filters accepted by the event schema.
 */
export const filters = [
  { from: 'document.meta.core_event.data.start', type: 'range' }
]

/**
 * List of fields used in the schema.
 */
export const fields = [
  'document.title',
  'document.meta.status',
  'document.meta.core_event.data.start',
  'document.meta.core_event.data.end',
  'document.meta.core_newsvalue.value',
  'document.meta.tt_slugline.value',
  'document.rel.organiser.title',
  'document.rel.section.uuid',
  'document.rel.section.title',
  'heads.usable.created',
  'heads.done.created',
  'heads.approved.created',
  'heads.withheld.created'
]

/**
 * Create a schema based on fields array.
 */
const schemaShape = fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<string, z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for wires.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the wiresSchema.
 */
type EventFields = z.infer<typeof _schema>

/**
 * Interface extending HitV1 with a fields property of type WireSchema.
 */
export interface Event extends HitV1 {
  fields: EventFields
  _relatedPlannings: string
}
