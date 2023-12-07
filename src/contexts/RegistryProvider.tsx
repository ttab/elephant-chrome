import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type PropsWithChildren
} from 'react'

interface RegistryProviderState {
  locale: string
  decimalFormat: string
}

interface RegistryProviderContext extends RegistryProviderState {
  setLocale: (locale: string) => void
  setDecimalFormat: (format: string) => void
}

type RegistryProviderActionType = 'SET_LOCALE' | 'SET_DECIMAL_FORMAT' | 'SET_DATE_FORMAT'
interface RegistryProviderAction {
  type: RegistryProviderActionType
  payload: unknown
}

/**
 * Initial state
 */
const initialState: RegistryProviderState = {
  locale: 'en-US',
  decimalFormat: '2-digit'
}

// TODO: Split this file into one per hook, provider and context

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

    case 'SET_DECIMAL_FORMAT':
      if (typeof payload === 'string') {
        return { ...state, decimalFormat: payload }
      }
      break
  }

  return state
}


/**
 * Registry context
 */
const RegistryContext = createContext<RegistryProviderState>(initialState)


/**
 * RegistryProvider
 *
 * @param children
 * @returns JSX.Element
 */
const RegistryProvider = ({ children, locale, decimalFormat }: PropsWithChildren<RegistryProviderState>): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  state.locale = locale
  state.decimalFormat = decimalFormat

  // Memoize the context value to avoid unnecessary re-renders
  const contextValue = useMemo((): RegistryProviderContext => {
    return {
      ...state,
      setLocale: (locale: string) => dispatch({
        type: 'UPDATE_LOCALE' as RegistryProviderActionType,
        payload: locale
      }),
      setDecimalFormat: (format: string) => dispatch({
        type: 'UPDATE_DECIMAL_FORMAT' as RegistryProviderActionType,
        payload: format
      })
    }
  }, [state])

  return <RegistryContext.Provider value={contextValue}>
    {children}
  </RegistryContext.Provider>
}


/**
 * Registry hook
 *
 * @returns RegistryProviderState
 */
const useRegistry = (): RegistryProviderState => {
  const context = useContext(RegistryContext)

  if (!context) {
    throw new Error('useRegistry must be used within a RegistryProvider')
  }
  return context
}

export { RegistryProvider, useRegistry }
