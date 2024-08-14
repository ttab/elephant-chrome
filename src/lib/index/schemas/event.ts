import { z } from 'zod'

const EventsSchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _relatedPlannings: z.array(z.string()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.meta.core_description.data.text': z.array(z.string()),
    'document.meta.core_event.data.dateGranularity': z.array(z.string()),
    'document.meta.core_description.role': z.array(z.string()),
    'document.meta.core_event.data.start': z.array(z.string()),
    'document.meta.core_event.data.end': z.array(z.string()),
    'document.rel.copyrightholder.title': z.array(z.string()),
    'document.meta.core_event.data.registration': z.array(z.string()),
    'document.meta.core_newsvalue.value': z.array(z.string()),
    'document.rel.category.type': z.array(z.string()),
    'document.rel.category.title': z.array(z.string()),
    'document.rel.category.uri': z.array(z.string()),
    'document.rel.category.uuid': z.array(z.string()),
    'document.rel.category.copyrightholder.title': z.array(z.string()),
    'document.rel.section.title': z.array(z.string()),
    'document.rel.section.type': z.array(z.string()),
    'document.rel.section.uri': z.array(z.string()),
    'document.rel.section.value': z.array(z.string()),
    'document.rel.subject.title': z.array(z.string()),
    'document.rel.subject.type': z.array(z.string()),
    'document.rel.subject.uuid': z.array(z.string()),
    'document.meta.tt_slugline.value': z.array(z.string()),
    'document.rel.story.title': z.array(z.string()),
    'document.rel.story.type': z.array(z.string()),
    'document.rel.story.uuid': z.array(z.string()),
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

export type Event = z.infer<typeof EventsSchema>
