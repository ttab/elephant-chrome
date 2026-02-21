import { useContext, useMemo } from 'react'
import { DocumentActivityContext } from './documentActivityContext'
import { useHistory, useNavigation, useView } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import type { View } from '@/types'
import type { ResolvedActivity } from './types'
import { toast } from 'sonner'

export function useDocumentActivities(
  docType: string,
  docId: string,
  args?: Record<string, unknown>
): ResolvedActivity[] {
  const context = useContext(DocumentActivityContext)

  if (!context) {
    throw new Error('useDocumentActivities must be used within a DocumentActivityProvider')
  }

  const history = useHistory()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return useMemo(() => {
    const entries = context.getEntries(docType)

    return entries.map((entry) => ({
      activityId: entry.activityId,
      title: entry.definition.title,
      icon: entry.definition.icon,
      execute: async () => {
        try {
          const resolved = await entry.definition.viewRouteFunc(docId, args)
          const viewItem = state.viewRegistry.get(resolved.viewName as View)

          handleLink({
            dispatch,
            viewItem,
            props: resolved.props,
            viewId: crypto.randomUUID(),
            origin,
            target: resolved.target,
            history
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          toast.error(`Could not open "${entry.definition.title}": ${message}`)
        }
      }
    }))
  }, [context, docType, docId, args, state.viewRegistry, dispatch, origin, history])
}
