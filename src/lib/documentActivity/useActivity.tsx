import { type MouseEvent as ReactMouseEvent, useContext, useMemo } from 'react'
import { DocumentActivityContext } from './documentActivityContext'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { useActivityExecutor, type ExecuteActivityOptions } from './useActivityExecutor'

export type ExecuteOptions = ExecuteActivityOptions

export interface ActivityHandle {
  title: string
  icon?: LucideIcon
  execute: (id: string, options?: ExecuteOptions) => void
  executeEvent: (id: string, event: ReactMouseEvent<Element> | KeyboardEvent) => void
}

/**
 * Process a DOM event into activity execution options.
 *
 * Returns null when the event indicates "open in new tab" (ctrl/meta key),
 * meaning the caller should not execute the activity. Otherwise returns
 * the extracted target and keepFocus options and consumes the event.
 */
export function resolveEventOptions(
  event: ReactMouseEvent<Element> | KeyboardEvent
): ExecuteOptions | null {
  if (event.ctrlKey || event.metaKey) {
    return null
  }

  event.preventDefault()
  event.stopPropagation()

  return {
    keepFocus: event instanceof KeyboardEvent && event.key === ' ',
    target: event.shiftKey ? 'last' : undefined
  }
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

  const { executeActivity } = useActivityExecutor()

  return useMemo(() => {
    const entries = context.getEntries(docType)
    const entry = entries.find((e) => e.activityId === activityId)

    if (!entry) {
      return null
    }

    return {
      title: entry.definition.title,
      icon: entry.definition.icon,
      execute: (id: string, options?: ExecuteOptions) => {
        executeActivity(entry, id, args, options)
      },
      executeEvent: (id: string, event: ReactMouseEvent<Element> | KeyboardEvent) => {
        const opts = resolveEventOptions(event)
        if (opts) {
          executeActivity(entry, id, args, opts)
        }
      }
    }
  }, [context, activityId, docType, args, executeActivity])
}
