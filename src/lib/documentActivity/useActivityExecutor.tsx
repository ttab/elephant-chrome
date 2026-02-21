import { useMemo } from 'react'
import { useHistory, useNavigation, useView } from '@/hooks'
import { handleLink, type Target } from '@/components/Link/lib/handleLink'
import type { View } from '@/types'
import type { ActivityEntry } from './types'
import { toast } from 'sonner'

export interface ExecuteActivityOptions {
  target?: Target
  keepFocus?: boolean
}

export interface ActivityExecutor {
  executeActivity: (
    entry: ActivityEntry,
    docId: string,
    args?: Record<string, unknown>,
    options?: ExecuteActivityOptions
  ) => void
}

/**
 * Shared hook that provides the navigation context and an execute function
 * for resolving an activity's route and navigating to it via handleLink.
 *
 * Used internally by both useActivity and useDocumentActivities.
 */
export function useActivityExecutor(): ActivityExecutor {
  const history = useHistory()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return useMemo(() => ({
    executeActivity(
      entry: ActivityEntry,
      docId: string,
      args?: Record<string, unknown>,
      options?: ExecuteActivityOptions
    ): void {
      entry.definition.viewRouteFunc(docId, args).then((resolved) => {
        const viewItem = state.viewRegistry.get(resolved.viewName as View)

        handleLink({
          dispatch,
          viewItem,
          props: resolved.props,
          viewId: crypto.randomUUID(),
          origin,
          target: resolved.target ?? options?.target,
          history,
          keepFocus: options?.keepFocus
        })
      }).catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Could not open "${entry.definition.title}": ${message}`)
      })
    }
  }), [state.viewRegistry, dispatch, origin, history])
}
