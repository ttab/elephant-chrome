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
import { Repository } from '@/shared/Repository'
import { Spellchecker } from '@/shared/Spellchecker'
import { Index } from '@/shared/Index'
import { Workflow } from '@/shared/Workflow'
import { User } from '@/shared/User'

const DEFAULT_LOCALE = 'en-BR'
const DEFAULT_TIMEZONE = 'Europe/Stockholm'

/** Registry registry provider state interface */
export interface RegistryProviderState {
  locale: string
  timeZone: string
  server: {
    webSocketUrl: URL
    indexUrl: URL
    repositoryEventsUrl: URL
    repositoryUrl: URL
    contentApiUrl: URL
    spellcheckUrl: URL
    userUrl: URL
    faroUrl: URL
  }
  repository?: Repository
  workflow?: Workflow
  index?: Index
  spellchecker?: Spellchecker
  user?: User
  dispatch: React.Dispatch<Partial<RegistryProviderState>>
}

/** Registry registry provider state */
const initialState: RegistryProviderState = {
  locale: getUserLocale() || DEFAULT_LOCALE,
  timeZone: getUserTimeZone() || DEFAULT_TIMEZONE,
  server: {
    webSocketUrl: new URL('http://localhost'),
    indexUrl: new URL('http://localhost'),
    repositoryEventsUrl: new URL('http://localhost'),
    repositoryUrl: new URL('http://localhost'),
    contentApiUrl: new URL('http://localhost'),
    spellcheckUrl: new URL('http://localhost'),
    userUrl: new URL('http://localhost'),
    faroUrl: new URL('http://localhost')
  },
  dispatch: () => { }
}


/** Context */
export const RegistryContext = createContext(initialState)


/** Registry context provider component */
export const RegistryProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    getServerUrls().then((server) => {
      const repository = new Repository(server.repositoryUrl.href)
      const workflow = new Workflow(server.repositoryUrl.href)
      const index = new Index(server.indexUrl.href)
      const spellchecker = new Spellchecker(server.spellcheckUrl.href)
      const user = new User(server.userUrl.href)

      dispatch({
        server,
        workflow,
        repository,
        index,
        spellchecker,
        user
      })
      setIsInitialized(true)
    }).catch((ex: Error) => {
      console.error(`Failed fetching server urls in RegistryProvider, ${ex.message}`, ex)
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
  const { locale, timeZone, server, repository, workflow, index, spellchecker, user } = action
  const partialState: Partial<RegistryProviderState> = {}

  if (typeof locale === 'string') {
    partialState.locale = locale
  }

  if (typeof timeZone === 'string') {
    partialState.timeZone = timeZone
  }

  if (typeof repository === 'object') {
    partialState.repository = repository
  }

  if (typeof workflow === 'object') {
    partialState.workflow = workflow
  }

  if (typeof index === 'object') {
    partialState.index = index
  }

  if (typeof spellchecker === 'object') {
    partialState.spellchecker = spellchecker
  }

  if (typeof user === 'object') {
    partialState.user = user
  }

  if (typeof server === 'object') {
    partialState.server = server
  }

  return {
    ...state,
    ...partialState
  }
}
