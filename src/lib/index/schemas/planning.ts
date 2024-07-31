import { z } from 'zod'

const PlanningSchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.meta.core_assignment.data.end': z.array(z.string()),
    'document.meta.core_assignment.data.end_date': z.array(z.string()),
    'document.meta.core_assignment.data.full_day': z.array(z.string()),
    'document.meta.core_assignment.data.public': z.array(z.string()),
    'document.meta.core_assignment.data.publish': z.array(z.string()),
    'document.meta.core_assignment.data.start': z.array(z.string()),
    'document.meta.core_assignment.data.start_date': z.array(z.string()),
    'document.meta.core_assignment.id': z.array(z.string()),
    'document.meta.core_assignment.meta.core_assignment_type.value': z.array(z.string()),
    'document.meta.core_assignment.meta.tt_slugline.value': z.array(z.string()),
    'document.meta.core_assignment.rel.assignee.name': z.array(z.string()),
    'document.meta.core_assignment.rel.assignee.role': z.array(z.string()),
    'document.meta.core_assignment.rel.assignee.type': z.array(z.string()),
    'document.meta.core_assignment.rel.assignee.uuid': z.array(z.string()),
    'document.meta.core_assignment.rel.deliverable.type': z.array(z.string()),
    'document.meta.core_assignment.rel.deliverable.uuid': z.array(z.string()),
    'document.meta.core_assignment.title': z.array(z.string()),
    'document.meta.core_planning_item.data.end_date': z.array(z.string()),
    'document.meta.core_planning_item.data.public': z.array(z.string()),
    'document.meta.core_planning_item.data.start_date': z.array(z.string()),
    'document.meta.core_planning_item.data.tentative': z.array(z.string()),
    'document.meta.core_newsvalue.value': z.array(z.string()),
    'document.meta.status': z.array(z.string()),
    'document.rel.sector.title': z.array(z.string()),
    'document.meta.tt_slugline.value': z.array(z.string()),
    'document.rel.sector.type': z.array(z.string()),
    'document.rel.sector.uri': z.array(z.string()),
    'document.rel.sector.uuid': z.array(z.string()),
    'document.rel.sector.value': z.array(z.string()),
    'document.rel.story.title': z.array(z.string()),
    'document.rel.story.type': z.array(z.string()),
    'document.rel.story.uuid': z.array(z.string()),
    'document.rel.event.uuid': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.type': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string()),
    'heads.usable.created': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()),
    'heads.usable.id': z.array(z.string()),
    'heads.usable.version': z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.null()
  }),
  fields: z.object({
    'document.title': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()),
    'heads.usable.id': z.array(z.number()),
    'heads.usable.version': z.array(z.number()),
    'heads.usable.created': z.array(z.string())
  }),
  sort: z.array(z.number())
})

export type Planning = z.infer<typeof PlanningSchema>
