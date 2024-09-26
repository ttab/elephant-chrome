import { z } from 'zod'

const AssignmentSchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.meta.core_assignment.data.dateGranularity': z.array(z.string()),
    'document.meta.core_assignment.data.end': z.array(z.string()),
    'document.meta.core_assignment.data.endDate': z.array(z.string()),
    'document.meta.core_assignment.data.start': z.array(z.string()),
    'document.meta.core_assignment.data.startDate': z.array(z.string()),
    'document.meta.core_assignment_type.value': z.array(z.string()),
    'document.rel.assigned_to.data.email': z.array(z.string()),
    'document.rel.assigned_to.title': z.array(z.string()),
    'document.rel.assigned_to.type': z.array(z.string()),
    'document.rel.assigned_to.uuid': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.array(z.string())
  }),
  fields: z.object({
    'document.title': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()).optional(),
    'heads.usable.id': z.array(z.number()).optional(),
    'heads.usable.version': z.array(z.number()).optional(),
    'heads.usable.created': z.array(z.string()).optional()
  }).optional(),
  sort: z.array(z.number())
})

export type Assignment = z.infer<typeof AssignmentSchema>
