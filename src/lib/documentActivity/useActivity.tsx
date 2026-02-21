import { type MouseEvent as ReactMouseEvent, useContext, useMemo } from 'react'
import { DocumentActivityContext } from './documentActivityContext'
import { useHistory, useNavigation, useView } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import type { View } from '@/types'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { toast } from 'sonner'

export interface ActivityHandle {
  title: string
  icon?: LucideIcon
  execute: (id: string, event?: ReactMouseEvent<Element> | KeyboardEvent) => void
}

export function useActivity(
  activityId: string,
  docType: string,
  args?: Record<string, unknown>
): ActivityHandle | null {
  const context = useContext(DocumentActivityContext)

  if (!context) {
    throw new Error('useActivity must be used within a DocumentActivityProvider')
  }

  const history = useHistory()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return useMemo(() => {
    const entries = context.getEntries(docType)
    const entry = entries.find((e) => e.activityId === activityId)

    if (!entry) {
      return null
    }

    return {
      title: entry.definition.title,
      icon: entry.definition.icon,
      execute: (id: string, event?: ReactMouseEvent<Element> | KeyboardEvent) => {
        if (event) {
          if (event.ctrlKey || event.metaKey) {
            return
          }

          event.preventDefault()
          event.stopPropagation()
        }

        const keepFocus = event instanceof KeyboardEvent && event.key === ' '
        const shiftKey = event?.shiftKey

        entry.definition.viewRouteFunc(id, args).then((resolved) => {
          const viewItem = state.viewRegistry.get(resolved.viewName as View)

          handleLink({
            dispatch,
            viewItem,
            props: resolved.props,
            viewId: crypto.randomUUID(),
            origin,
            target: resolved.target ?? (shiftKey ? 'last' : undefined),
            history,
            keepFocus
          })
        }).catch((error) => {
          const message = error instanceof Error ? error.message : 'Unknown error'
          toast.error(`Could not execute "${entry.definition.title}": ${message}`)
        })
      }
    }
  }, [context, activityId, docType, args, state.viewRegistry, dispatch, origin, history])
}
