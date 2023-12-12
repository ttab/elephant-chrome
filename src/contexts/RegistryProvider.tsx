import {
  createContext,
  useReducer,
  useMemo,
  type PropsWithChildren
} from 'react'
import { getUserLocale } from 'get-user-locale'
import { getUserTimeZone } from '@/lib/getUserTimeZone'

export interface RegistryProviderState {
  locale: string
  timeZone: string
}

interface RegistryProviderContext extends RegistryProviderState {
  setLocale: (locale: string) => void
  setTimeZone: (timeZone: string) => void
}

type RegistryProviderActionType = 'SET_LOCALE' | 'SET_TIME_ZONE'
interface RegistryProviderAction {
  type: RegistryProviderActionType
  payload: unknown
}

/**
 * Initial state
 * TODO: Fetch from future users settings stored in local storage or elsewhere
 */
const initialState: RegistryProviderState = {
  locale: getUserLocale() || 'en-US',
  timeZone: getUserTimeZone() || 'America/New_York'
}

/**
 * RegistryReducer
 *
 * @param state
 * @param action
 * @returns RegistryProviderState
 */
const reducer = (state: RegistryProviderState, action: RegistryProviderAction): RegistryProviderState => {
  const { type, payload } = action

  switch (type) {
    case 'SET_LOCALE':
      if (typeof payload === 'string') {
        return { ...state, locale: payload }
      }
      break

    case 'SET_TIME_ZONE':
      if (typeof payload === 'string') {
        return { ...state, timeZone: payload }
      }
      break
  }

  return state
}


/**
 * Registry context
 */
export const RegistryContext = createContext<RegistryProviderState>(initialState)


/**
 * RegistryProvider
 *
 * @param children
 * @returns JSX.Element
 */
const RegistryProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Memoize the context value to avoid unnecessary re-renders
  const contextValue = useMemo((): RegistryProviderContext => {
    return {
      ...state,
      setLocale: (locale: string) => dispatch({
        type: 'UPDATE_LOCALE' as RegistryProviderActionType,
        payload: locale
      }),
      setTimeZone: (timeZone: string) => dispatch({
        type: 'UPDATE_TIME_ZONE' as RegistryProviderActionType,
        payload: timeZone
      })
    }
  }, [state])

  return <RegistryContext.Provider value={contextValue}>
    {children}
  </RegistryContext.Provider>
}


export { RegistryProvider }
