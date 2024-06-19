import React, {
  createContext,
  useReducer,
  type PropsWithChildren,
  useEffect,
  useState
} from 'react'

import { getServerUrls } from '@/lib/getServerUrls'
import { getUserLocale } from 'get-user-locale'
import { getUserTimeZone } from '@/lib/getUserTimeZone'

const DEFAULT_LOCALE = 'en-BR'
const DEFAULT_TIMEZONE = 'Europe/Stockholm'

/** Registry registry provider state interface */
export interface RegistryProviderState {
  locale: string
  timeZone: string
  server: {
    webSocketUrl: URL
    indexUrl: URL
    contentApiUrl: URL
  }
  dispatch: React.Dispatch<Partial<RegistryProviderState>>
}

/** Registry registry provider state */
const initialState: RegistryProviderState = {
  locale: getUserLocale() || DEFAULT_LOCALE,
  timeZone: getUserTimeZone() || DEFAULT_TIMEZONE,
  server: {
    webSocketUrl: new URL('http://localhost'),
    indexUrl: new URL('http://localhost'),
    contentApiUrl: new URL('http://localhost')
  },
  dispatch: () => { }
}


/** Context */
export const RegistryContext = createContext(initialState)


/** Registry contenxt provider component */
export const RegistryProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    getServerUrls()
      .then(server => {
        dispatch({ server })
        setIsInitialized(true)
      })
      .catch(ex => {
        console.error(`Failed fetching server urls in RegistryProvider, ${ex.message}`)
      })
  }, [])

  return (
    <RegistryContext.Provider value={{ ...state, dispatch }}>
      {isInitialized && children}
    </RegistryContext.Provider>
  )
}


/**
 * Registry context reducer
 */
const reducer = (state: RegistryProviderState, action: Partial<RegistryProviderState>): RegistryProviderState => {
  const { locale, timeZone, server } = action
  const partialState: Partial<RegistryProviderState> = {}

  if (typeof locale === 'string') {
    partialState.locale = locale
  }

  if (typeof timeZone === 'string') {
    partialState.timeZone = timeZone
  }

  if (typeof server === 'object') {
    partialState.server = server
  }

  return {
    ...state,
    ...partialState
  }
}
