import React, {
  createContext,
  useReducer,
  type PropsWithChildren,
  useEffect,
  useState,
  type JSX
} from 'react'

import { getServerEnvs } from '@/lib/getServerEnvs'
import { getUserTimeZone } from '@/lib/getUserTimeZone'
import { Repository } from '@/shared/Repository'
import { Spellchecker } from '@/shared/Spellchecker'
import { Index } from '@/shared/Index'
import { Workflow } from '@/shared/Workflow'
import { User } from '@/shared/User'
import type { LocaleData } from '@/types'
import { Baboon } from '@/shared/Baboon'
import { setSystemLanguage } from '@/shared/getSystemLanguage'
import { initI18n } from '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import { Collaboration } from '@/defaults'
import { defaultLocale } from '@/defaults/locale'
import { setEnvironment } from '@/shared/getEnvironment'

export type FeatureFlags = Record<string, string | boolean>

/** Registry registry provider state interface */
export interface RegistryProviderState {
  locale: LocaleData
  timeZone: string
  featureFlags: FeatureFlags
  server: {
    webSocketUrl: URL
    indexUrl: URL
    repositoryEventsUrl: URL
    repositoryUrl: URL
    contentApiUrl: URL
    spellcheckUrl: URL
    userUrl: URL
    faroUrl: URL
    baboonUrl: URL
  }
  repository?: Repository
  workflow?: Workflow
  index?: Index
  spellchecker?: Spellchecker
  user?: User
  baboon?: Baboon
  dispatch: React.Dispatch<Partial<RegistryProviderState>>
  userColor: string
}

const colors = Object.keys(Collaboration.colors)

/** Registry registry provider state */
export const initialState: RegistryProviderState = {
  locale: defaultLocale,
  timeZone: getUserTimeZone() || DEFAULT_TIMEZONE,
  userColor: colors[Math.floor(Math.random() * colors.length)],
  featureFlags: {},

  server: {
    webSocketUrl: new URL('http://localhost'),
    indexUrl: new URL('http://localhost'),
    repositoryEventsUrl: new URL('http://localhost'),
    repositoryUrl: new URL('http://localhost'),
    contentApiUrl: new URL('http://localhost'),
    spellcheckUrl: new URL('http://localhost'),
    userUrl: new URL('http://localhost'),
    faroUrl: new URL('http://localhost'),
    baboonUrl: new URL('http://localhost')
  },
  dispatch: () => { }
}


/** Context */
export const RegistryContext = createContext(initialState)


/** Registry context provider component */
export const RegistryProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const { t } = useTranslation('shared')
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initI18n()
        const { urls: server, envs, featureFlags } = await getServerEnvs()
        setSystemLanguage(envs.systemLanguage)
        setEnvironment(envs.environment)

        const locale = defaultLocale

        const repository = new Repository(server.repositoryUrl.href)
        const workflow = new Workflow(server.repositoryUrl.href)
        const index = new Index(server.indexUrl.href)
        const spellchecker = new Spellchecker(server.spellcheckUrl.href)
        const user = new User(server.userUrl.href)
        const baboon = new Baboon(server.baboonUrl.href)

        dispatch({
          server,
          locale,
          featureFlags,
          workflow,
          repository,
          index,
          spellchecker,
          user,
          baboon
        })
        setIsInitialized(true)
      } catch (ex) {
        const message = ex instanceof Error ? ex.message : 'Unknown error'
        console.error(`Failed initializing RegistryProvider: ${message}`, ex)
        setInitError(message)
      }
    }

    void initialize()
  }, [])

  if (initError) {
    return (
      <div className='flex h-screen items-center justify-center p-6'>
        <div className='max-w-md text-center'>
          <h1 className='text-2xl font-bold mb-2'>{t('init.failedTitle')}</h1>
          <p className='text-sm text-muted-foreground mb-4'>{initError}</p>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90'
          >
            {t('init.retryButton')}
          </button>
        </div>
      </div>
    )
  }

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
  const { locale, timeZone, featureFlags, server, repository, workflow, index, spellchecker, user, baboon } = action
  const partialState: Partial<RegistryProviderState> = {}

  if (typeof locale === 'object') {
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

  if (typeof baboon === 'object') {
    partialState.baboon = baboon
  }

  if (typeof featureFlags === 'object') {
    partialState.featureFlags = featureFlags
  }

  return {
    ...state,
    ...partialState
  }
}
