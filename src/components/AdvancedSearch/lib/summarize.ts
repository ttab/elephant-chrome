import type { AdvancedSearchState, BadgeKey, SearchFieldConfig } from '../types'

export type TranslateFunction = (key: string, options?: Record<string, string | number>) => string

export interface SearchBadge {
  key: BadgeKey
  label: string
}

export function summarizeState(
  state: AdvancedSearchState,
  fields: SearchFieldConfig[],
  t: TranslateFunction
): SearchBadge[] {
  const badges: SearchBadge[] = []

  if (state.mode === 'querySyntax') {
    const raw = state.querySyntax.raw.trim()
    if (raw) {
      badges.push({
        key: 'queryString',
        label: raw.length > 40 ? `${raw.slice(0, 40)}...` : raw
      })
    }
    return badges
  }

  const s = state.structured
  const query = s.query.trim()

  if (query) {
    badges.push({ key: 'query', label: query.length > 30 ? `${query.slice(0, 30)}...` : query })
  }

  if (s.dateRange.from || s.dateRange.to) {
    const parts = []
    if (s.dateRange.from) parts.push(s.dateRange.from)
    parts.push('–')
    if (s.dateRange.to) parts.push(s.dateRange.to)
    badges.push({ key: 'dateRange', label: parts.join(' ') })
  }

  if (s.matchType === 'phrase') {
    badges.push({ key: 'matchType', label: t('advancedSearch.exactPhrase') })
  }

  if (s.booleanAnd) {
    badges.push({ key: 'booleanAnd', label: t('advancedSearch.requireAllTerms') })
  }

  if (s.fuzzy) {
    badges.push({ key: 'fuzzy', label: t('advancedSearch.badge.fuzzy', { edits: s.fuzzyEdits }) })
  }

  if (s.boost > 1) {
    badges.push({ key: 'boost', label: t('advancedSearch.badge.boost', { boost: s.boost }) })
  }

  const defaultFields = fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
  const selected = s.selectedFields
  const isCustomFields = selected.length > 0
    && (selected.length !== defaultFields.length || selected.some((f) => !defaultFields.includes(f)))

  if (isCustomFields) {
    const fieldLabels = selected
      .map((fp) => fields.find((f) => f.fieldPath === fp)?.labelKey)
      .filter((key): key is string => !!key)
      .map((key) => t(key))
      .join(', ')
    badges.push({ key: 'fields', label: t('advancedSearch.badge.fields', { fields: fieldLabels }) })
  }

  if (s.fieldExists.length > 0) {
    const labels = s.fieldExists.map((fe) => {
      const label = fields.find((f) => f.fieldPath === fe.field)?.labelKey
      const name = label ? t(label) : fe.field
      return fe.exists ? name : `¬${name}`
    }).join(', ')
    badges.push({ key: 'fieldExists', label: labels })
  }

  return badges
}
