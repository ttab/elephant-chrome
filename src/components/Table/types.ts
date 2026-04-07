import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { View } from '@/types/index'

/**
 * Minimal contract for any Table row data.
 * Both WebSocket-sourced (preprocessed) and Index-sourced (HitV1)
 * data satisfy this through structural typing.
 */
export interface TableRowData {
  id: string
}

/**
 * Navigation parameters resolved from a row before opening a document.
 */
export interface NavigationParams {
  id: string
  version?: string
  opensWith?: View
}

/**
 * Standard shape for preprocessed WebSocket data in tables.
 * All preprocessor views (Latest, Assignments, PlanningOverview, EventsOverview)
 * should extend this instead of composing ad-hoc intersections.
 */
export interface PreprocessedTableData<
  TDecorator,
  TPreprocessed extends Record<string, unknown>
> extends DocumentStateWithDecorators<TDecorator>, TableRowData {
  _preprocessed: TPreprocessed
}
