import {
  QueryV1,
  MultiMatchQueryV1,
  Fuzziness
} from '@ttab/elephant-api/index'
import type { AdvancedSearchState, SearchFieldConfig } from '../types'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Replace user-friendly field aliases with actual OpenSearch field paths
 * in a query syntax string. E.g. `title:"ukraine"` -> `document.title:"ukraine"`
 * Uses word boundaries to avoid matching substrings (e.g. 'subtitle:' won't match the 'title' alias).
 */
function replaceFieldAliases(raw: string, fields: SearchFieldConfig[]): string {
  let result = raw
  for (const field of fields) {
    const pattern = new RegExp(`\\b${escapeRegExp(field.syntaxAlias)}:`, 'g')
    result = result.replace(pattern, `${field.fieldPath}:`)
  }
  return result
}

export function buildAdvancedQuery(
  state: AdvancedSearchState,
  fields: SearchFieldConfig[]
): QueryV1 | undefined {
  if (state.mode === 'querySyntax') {
    const raw = state.querySyntax.raw.trim()
    if (!raw) {
      return undefined
    }

    return QueryV1.create({
      conditions: {
        oneofKind: 'queryString',
        queryString: replaceFieldAliases(raw, fields)
      }
    })
  }

  const query = state.structured.query.trim()
  if (!query) {
    return undefined
  }

  const selectedFields = state.structured.selectedFields.length > 0
    ? state.structured.selectedFields
    : fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)

  const multiMatch = MultiMatchQueryV1.create({
    fields: selectedFields,
    query,
    type: state.structured.matchType,
    booleanAnd: state.structured.booleanAnd
  })

  if (state.structured.fuzzy) {
    multiMatch.fuzziness = Fuzziness.create({
      edits: BigInt(state.structured.fuzzyEdits)
    })
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'multiMatch',
      multiMatch
    }
  })
}
