import { z } from 'zod'
import { BaseSchema } from './base'

const OrganisationSchema = z.object({
  _source: z.object({
    current_version: z.array(z.string()),
    'document.meta.core_contact_info.data.city': z.array(z.string()),
    'document.meta.core_contact_info.data.country': z.array(z.string()),
    'document.meta.core_contact_info.data.email': z.array(z.string()),
    'document.meta.core_contact_info.data.phone': z.array(z.string()),
    'document.meta.core_contact_info.data.streetAddress': z.array(z.string()),
    'document.rel.see_also.type': z.array(z.string()),
    'document.rel.see_also.url': z.array(z.string()),
    text: z.array(z.string())
  })
})

const FullOrganisationSchema = BaseSchema.and(OrganisationSchema)
export type IndexedOrganisation = z.infer<typeof FullOrganisationSchema>
