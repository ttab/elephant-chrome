import {
  useReducer,
  type PropsWithChildren,
  useEffect,
  type JSX
} from 'react'
import type { ContentState } from '@/types'
import { NavigationActionType } from '@/types'

import { useHistory, useNavigationKeys } from '@/hooks'
import {
  navigationReducer,
  initializeNavigationState
} from '@/navigation/lib'
import { NavigationContext } from './NavigationContext'
import type { HistoryEvent, HistoryState } from './hooks/useHistory'

const initialState = initializeNavigationState()

export const NavigationProvider = ({ children }: PropsWithChildren & {
}): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const history = useHistory()

  /*
   * Sync the reducer with window.history on real navigation events
   * (browser back/forward, plus the synthetic popstate dispatched by
   * pushState / non-silent replaceState). Silent replaceState - used by
   * setActiveView to update the URL without a navigation - intentionally
   * does not dispatch popstate; the activeview listener below handles it.
   */
  useEffect(() => {
    const handlePopState = (): void => {
      const state = window.history.state as HistoryState | null
      if (state) {
        dispatch({
          type: NavigationActionType.SET,
          active: state.viewId,
          content: state.contentState
        })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  /*
   * Handle switch between active views
   */
  useEffect(() => {
    const handleSetActive = (e: HistoryEvent): void => {
      if (e.detail) {
        dispatch({
          type: NavigationActionType.ACTIVE,
          viewId: e.detail.viewId
        })
      }
    }

    window.addEventListener('activeview', handleSetActive)
    return () => window.removeEventListener('activeview', handleSetActive)
  }, [])


  // Let the user navigate between open views using <- and ->
  useNavigationKeys({
    onNavigation: (event) => {
      if (!event.altKey) {
        return
      }

      const content: ContentState[] = history.state?.contentState || []
      let idx = content.findIndex((obj) => obj.viewId === state.active)

      if (event.key === 'ArrowLeft' && idx > 0) {
        idx--
      } else if (event.key === 'ArrowRight' && idx < content.length - 1) {
        idx++
      } else {
        return
      }

      history.replaceState(content[idx].path, {
        viewId: content[idx].viewId,
        contentState: content
      })
    },
    keys: ['alt+ArrowLeft', 'alt+ArrowRight']
  })

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  )
}
