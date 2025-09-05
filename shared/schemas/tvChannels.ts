import { z } from 'zod'
import type { FieldValuesV1, HitV1 } from '@ttab/elephant-api/index'

/**
 * List of fields used in the schema.
 */
const _fields = [
  'document.title',
  'text',
  'document.meta.tt_tv_channel.name',
  'document.uri'
] as const

/**
 * Create a schema based on fields array.
 */
const schemaShape = _fields.reduce((acc, field) => {
  acc[field] = z.any()
  return acc
}, {} as Record<(typeof _fields)[number], z.ZodType<FieldValuesV1>>)

/**
 * Zod schema for tv channels.
 */
const _schema = z.object(schemaShape)

/**
 * Type inferred from the TVChannels for document fields.
 */
export type TVChannelsObject = z.infer<typeof _schema>

/**
 * Type inferred from fields
 */
export type TVChannelsFields = Array<keyof typeof _fields>

/**
 * Interface extending HitV1 with a fields property of type TVChannelsFields
 */
export interface TVChannels extends HitV1 {
  fields: TVChannelsObject
}

/**
 * Export fields and cast it as TVChannelsFields
 */
export const fields = _fields as unknown as TVChannelsFields
