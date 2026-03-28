export type FieldPath = string & { readonly __brand: 'FieldPath' }
export type SyntaxAlias = string & { readonly __brand: 'SyntaxAlias' }

export interface SearchFieldConfig {
  labelKey: string
  fieldPath: FieldPath
  syntaxAlias: SyntaxAlias
  defaultSelected: boolean
}

export interface StructuredSearchState {
  query: string
  selectedFields: FieldPath[]
  matchType: 'best_fields' | 'phrase'
  fuzzy: boolean
  fuzzyEdits: 1 | 2
  booleanAnd: boolean
}

export interface QuerySyntaxState {
  raw: string
}

export type SearchMode = 'structured' | 'querySyntax'

export interface AdvancedSearchState {
  mode: SearchMode
  structured: StructuredSearchState
  querySyntax: QuerySyntaxState
}

export type BadgeKey = 'query' | 'matchType' | 'booleanAnd' | 'fuzzy' | 'fields' | 'queryString'

export interface AdvancedSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: SearchFieldConfig[]
  state: AdvancedSearchState
  onApply: (state: AdvancedSearchState) => void
  onClear: () => void
}
