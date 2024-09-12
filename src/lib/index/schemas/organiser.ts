import { z } from 'zod'
import { BaseSchema } from './base'

const OrganiserSchema = z.object({
  _source: z.object({
    'document.meta.core_contact_info.data.city': z.array(z.string()),
    'document.meta.core_contact_info.data.country': z.array(z.string()),
    'document.meta.core_contact_info.data.email': z.array(z.string()),
    'document.meta.core_contact_info.data.phone': z.array(z.string()),
    'document.meta.core_contact_info.data.streetAddress': z.array(z.string())
  })
})

const FullOrganiserSchema = BaseSchema.and(OrganiserSchema)
export type IndexedOrganiser = z.infer<typeof FullOrganiserSchema>
