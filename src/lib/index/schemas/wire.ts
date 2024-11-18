import { z } from 'zod'

const _WireSchema = z.object({
  _index: z.string(),
  _id: z.string(),
  _score: z.nullable(z.number()),
  _source: z.object({
    created: z.array(z.string()),
    current_version: z.array(z.string()),
    modified: z.array(z.string()),
    readers: z.array(z.string()),
    text: z.null(),
    'document.content.core_text.data.text': z.array(z.string()),
    'document.content.core_text.role': z.array(z.string()),
    'document.language': z.array(z.string()),
    'document.meta.core_newsvalue.value': z.array(z.string()),
    'document.meta.tt_slugline.value': z.array(z.string()),
    'document.meta.tt_wire.data.copyright': z.array(z.string()),
    'document.meta.tt_wire.data.firstCreated': z.array(z.string()),
    'document.meta.tt_wire.data.issued': z.array(z.string()),
    'document.meta.tt_wire.data.version': z.array(z.string()),
    'document.rel.provider.title': z.array(z.string()),
    'document.rel.provider.uri': z.array(z.string()),
    'document.rel.section.title': z.array(z.string()),
    'document.rel.section.type': z.array(z.string()),
    'document.rel.section.uuid': z.array(z.string()),
    'document.rel.source.type': z.array(z.string()),
    'document.rel.source.uri': z.array(z.string()),
    'document.rel.subject.title': z.array(z.string()),
    'document.rel.subject.type': z.array(z.string()),
    'document.rel.subject.uri': z.array(z.string()),
    'document.rel.subject.uuid': z.array(z.string()),
    'document.title': z.array(z.string()),
    'document.uri': z.array(z.string()),
    'document.url': z.array(z.string())
  }),
  fields: z.object({
    'document.title': z.array(z.string()),
    'document.rel.section.uuid': z.array(z.string()),
    'heads.usable.creator': z.array(z.string()),
    'heads.usable.id': z.array(z.number()),
    'heads.usable.version': z.array(z.number()),
    'heads.usable.created': z.array(z.string())
  }),
  sort: z.array(z.number())
})

export type Wire = z.infer<typeof _WireSchema>
