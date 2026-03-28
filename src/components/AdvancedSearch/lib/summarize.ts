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

  const query = state.structured.query.trim()
  if (!query) {
    return badges
  }

  badges.push({ key: 'query', label: query.length > 30 ? `${query.slice(0, 30)}...` : query })

  if (state.structured.matchType === 'phrase') {
    badges.push({ key: 'matchType', label: t('advancedSearch.exactPhrase') })
  }

  if (state.structured.booleanAnd) {
    badges.push({ key: 'booleanAnd', label: t('advancedSearch.requireAllTerms') })
  }

  if (state.structured.fuzzy) {
    badges.push({ key: 'fuzzy', label: t('advancedSearch.badge.fuzzy', { edits: state.structured.fuzzyEdits }) })
  }

  const defaultFields = fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
  const selected = state.structured.selectedFields
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

  return badges
}
