import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import type { FieldPath, SearchFieldConfig, SyntaxAlias } from './types'

function field(labelKey: string, fieldPath: string, syntaxAlias: string, defaultSelected: boolean): SearchFieldConfig {
  return { labelKey, fieldPath: fieldPath as FieldPath, syntaxAlias: syntaxAlias as SyntaxAlias, defaultSelected }
}

export const planningsFields: SearchFieldConfig[] = [
  field('advancedSearch.fields.title', 'document.title', 'title', true),
  field('advancedSearch.fields.assignment', 'document.meta.core_assignment.title', 'assignment', true),
  field('advancedSearch.fields.description', 'document.meta.core_description.data.text', 'description', true),
  field('advancedSearch.fields.slugline', 'document.meta.tt_slugline.value', 'slugline', true)
]

export const eventsFields: SearchFieldConfig[] = [
  field('advancedSearch.fields.title', 'document.title', 'title', true),
  field('advancedSearch.fields.description', 'document.meta.core_description.data.text', 'description', true),
  field('advancedSearch.fields.slugline', 'document.meta.tt_slugline.value', 'slugline', true)
]

export const articlesFields: SearchFieldConfig[] = [
  field('advancedSearch.fields.title', 'document.title', 'title', true),
  field('advancedSearch.fields.content', 'document.content.core_text.data.text', 'content', true),
  field('advancedSearch.fields.slugline', 'document.meta.tt_slugline.value', 'slugline', true),
  field('advancedSearch.fields.subject', 'document.rel.subject.title', 'subject', true)
]

export const factboxFields: SearchFieldConfig[] = [
  field('advancedSearch.fields.title', 'document.title', 'title', true),
  field('advancedSearch.fields.content', 'document.content.core_text.data.text', 'content', true)
]

export const wiresFields: SearchFieldConfig[] = [
  field('advancedSearch.fields.title', 'document.title', 'title', true),
  field('advancedSearch.fields.content', 'document.content.core_text.data.text', 'content', true),
  field('advancedSearch.fields.table', 'document.content.core_table.data.tbody', 'table', false)
]

export const fieldsBySearchType: Record<SearchKeys, SearchFieldConfig[]> = {
  plannings: planningsFields,
  events: eventsFields,
  articles: articlesFields
}

export const dateFields = {
  articles: 'heads.usable.created',
  plannings: 'document.meta.core_planning_item.data.start_date',
  events: 'document.meta.core_event.data.start',
  wires: 'modified',
  factboxes: 'modified'
} as const
