import type { LucideIcon } from '@ttab/elephant-ui/icons'
import type { ViewProps } from '@/types'
import type { Target } from '@/components/Link/lib/handleLink'

export type DocumentType = string
export type ActivityId = string

export interface ResolvedRoute {
  viewName: string
  props: ViewProps
  target?: Target
}

export type ViewRouteFunc = (
  docId: string,
  args?: Record<string, unknown>
) => Promise<ResolvedRoute>

// Phase 2: field-based matching predicate for contextual filtering
export type MatchFunc = (fields: Record<string, unknown>) => boolean

export interface ActivityDefinition {
  title: string
  icon?: LucideIcon
  viewRouteFunc: ViewRouteFunc
  matchFunc?: MatchFunc
}

export interface ActivityEntry {
  docType: DocumentType
  activityId: ActivityId
  definition: ActivityDefinition
}

export interface ActivityExecuteOptions {
  target?: Target
}

export interface ResolvedActivity {
  activityId: ActivityId
  title: string
  icon?: LucideIcon
  execute: (options?: ActivityExecuteOptions) => Promise<void>
}
