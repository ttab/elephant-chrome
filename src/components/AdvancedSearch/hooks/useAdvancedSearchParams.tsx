import { useCallback, useMemo } from 'react'
import type { QueryParams } from '@/hooks/useQuery'
import type { AdvancedSearchState, FieldPath, SearchFieldConfig } from '../types'
import { createDefaultState, isActiveState } from '../lib/defaultState'

const ADV_KEYS = ['advMode', 'advQuery', 'advFields', 'advMatch', 'advFuzzy', 'advFuzzyPrefix', 'advAnd', 'advRaw', 'advDateFrom', 'advDateTo', 'advBoost', 'advExists', 'advMissing'] as const

export function serializeAdvancedState(state: AdvancedSearchState): QueryParams {
  if (!isActiveState(state)) {
    return {}
  }

  if (state.mode === 'querySyntax') {
    return {
      advMode: 'querySyntax',
      advRaw: state.querySyntax.raw
    }
  }

  const params: QueryParams = {
    advMode: 'structured',
    advQuery: state.structured.query
  }

  if (state.structured.selectedFields.length > 0) {
    params.advFields = state.structured.selectedFields.join(',')
  }

  if (state.structured.matchType !== 'best_fields') {
    params.advMatch = state.structured.matchType
  }

  if (state.structured.fuzzy) {
    params.advFuzzy = String(state.structured.fuzzyEdits)
    if (state.structured.fuzzyPrefixLength > 0) {
      params.advFuzzyPrefix = String(state.structured.fuzzyPrefixLength)
    }
  }

  if (state.structured.booleanAnd) {
    params.advAnd = '1'
  }

  if (state.structured.dateRange.from) {
    params.advDateFrom = state.structured.dateRange.from
  }

  if (state.structured.dateRange.to) {
    params.advDateTo = state.structured.dateRange.to
  }

  if (state.structured.boost > 1) {
    params.advBoost = String(state.structured.boost)
  }

  const existsFields = state.structured.fieldExists.filter((fe) => fe.exists).map((fe) => fe.field)
  const missingFields = state.structured.fieldExists.filter((fe) => !fe.exists).map((fe) => fe.field)
  if (existsFields.length > 0) {
    params.advExists = existsFields.join(',')
  }
  if (missingFields.length > 0) {
    params.advMissing = missingFields.join(',')
  }

  return params
}

export function deserializeAdvancedState(
  filter: QueryParams,
  fields: SearchFieldConfig[]
): AdvancedSearchState {
  const mode = Array.isArray(filter.advMode) ? filter.advMode[0] : filter.advMode
  if (!mode || (mode !== 'querySyntax' && mode !== 'structured')) {
    return createDefaultState(fields)
  }

  if (mode === 'querySyntax') {
    return {
      mode: 'querySyntax',
      structured: createDefaultState(fields).structured,
      querySyntax: {
        raw: String(filter.advRaw || '')
      }
    }
  }

  const advFields = Array.isArray(filter.advFields) ? filter.advFields[0] : filter.advFields
  const selectedFields = advFields ? advFields.split(',') as FieldPath[] : fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
  const fuzzyStr = Array.isArray(filter.advFuzzy) ? filter.advFuzzy[0] : filter.advFuzzy
  const fuzzyPrefixStr = Array.isArray(filter.advFuzzyPrefix) ? filter.advFuzzyPrefix[0] : filter.advFuzzyPrefix
  const boostStr = Array.isArray(filter.advBoost) ? filter.advBoost[0] : filter.advBoost
  const existsStr = Array.isArray(filter.advExists) ? filter.advExists[0] : filter.advExists
  const missingStr = Array.isArray(filter.advMissing) ? filter.advMissing[0] : filter.advMissing

  const fieldExists: { field: FieldPath, exists: boolean }[] = [
    ...(existsStr ? existsStr.split(',').map((f) => ({ field: f as FieldPath, exists: true })) : []),
    ...(missingStr ? missingStr.split(',').map((f) => ({ field: f as FieldPath, exists: false })) : [])
  ]

  return {
    mode: 'structured',
    structured: {
      query: String(filter.advQuery || ''),
      selectedFields,
      matchType: String(filter.advMatch || '') === 'phrase' ? 'phrase' : 'best_fields',
      fuzzy: !!fuzzyStr,
      fuzzyEdits: fuzzyStr === '1' ? 1 : 2,
      fuzzyPrefixLength: Number(fuzzyPrefixStr) || 0,
      booleanAnd: filter.advAnd === '1',
      boost: Number(boostStr) || 1,
      dateRange: {
        from: String(filter.advDateFrom || ''),
        to: String(filter.advDateTo || '')
      },
      fieldExists
    },
    querySyntax: { raw: '' }
  }
}

export function hasAdvancedParams(filter: QueryParams): boolean {
  return !!filter.advMode
}

export function clearAdvancedParams(): QueryParams {
  const params: QueryParams = {}
  for (const key of ADV_KEYS) {
    params[key] = undefined
  }
  return params
}

export function useAdvancedSearchParams(
  filter: QueryParams,
  fields: SearchFieldConfig[],
  setQueryString: (params: QueryParams) => void
) {
  const advCacheKey = ADV_KEYS.map((k) => filter[k] ?? '').join('|')

  const state = useMemo(
    () => deserializeAdvancedState(filter, fields),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recompute when adv* params change
    [advCacheKey, fields]
  )

  const isAdvancedActive = useMemo(
    () => hasAdvancedParams(filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advCacheKey]
  )

  const applyAdvancedSearch = useCallback(
    (newState: AdvancedSearchState) => {
      const advParams = serializeAdvancedState(newState)
      // Advanced and basic search are mutually exclusive
      setQueryString({
        ...advParams,
        query: undefined
      })
    },
    [setQueryString]
  )

  const clearAdvancedSearch = useCallback(
    () => {
      setQueryString(clearAdvancedParams())
    },
    [setQueryString]
  )

  return {
    state,
    isAdvancedActive,
    applyAdvancedSearch,
    clearAdvancedSearch
  }
}
