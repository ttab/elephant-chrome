import {
  useReducer,
  useLayoutEffect,
  type PropsWithChildren,
  useEffect,
  useMemo
} from 'react'
import type { ContentState } from '@/types'
import { NavigationActionType } from '@/types'

import { useHistory, useNavigationKeys } from '@/hooks'
import {
  navigationReducer,
  initializeNavigationState
} from '@/navigation/lib'
import { NavigationContext } from './NavigationContext'
import type { HistoryEvent } from './hooks/useHistory'
import type { QueryParams } from '@/hooks/useQuery'


export const NavigationProvider = ({ children, filters }: PropsWithChildren & {
  filters?: Record<string, QueryParams>
}): JSX.Element => {
  const initialState = useMemo(() => initializeNavigationState(filters),
    // Only on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const history = useHistory()

  /*
   * Handle user navigating browser history back and forth
   */
  useLayoutEffect(() => {
    if (history.state) {
      dispatch({
        type: NavigationActionType.SET,
        active: history.state.viewId,
        content: history.state.contentState
      })
    }
  }, [history.state])

  /*
   * Handle swith between active views
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
