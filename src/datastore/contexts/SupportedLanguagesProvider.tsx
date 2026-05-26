import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { type IDBLanguage, type SupportedLanguage } from '../types'

interface SupportedLanguagesProviderState {
  languages: IDBLanguage[]
  // Pre-computed list of language codes. Kept on the context so consumers
  // share a single stable reference - re-mapping in the hook would hand
  // every textbit a fresh array on every render.
  languageCodes: string[]
}

export const SupportedLanguagesContext = createContext<SupportedLanguagesProviderState>({
  languages: [],
  languageCodes: []
})

export const SupportedLanguagesProvider = ({ children }: {
  children: React.ReactNode
}) => {
  const { data: session } = useSession()
  const [languages, setLanguages] = useState<IDBLanguage[]>([])
  const IDB = useIndexedDB()
  const { server: { spellcheckUrl } } = useRegistry()

  const getOrRefreshCache = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !spellcheckUrl || !IDB.isConnected) {
      return
    }

    const cachedLanguages: IDBLanguage[] | undefined = await IDB.get('languages')

    if (Array.isArray(cachedLanguages) && cachedLanguages.length) {
      setLanguages(cachedLanguages)
    } else {
      const supportedLanguagesUrl = new URL('/twirp/elephant.spell.Dictionaries/SupportedLanguages', spellcheckUrl.href)

      const response = await fetch(supportedLanguagesUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session?.accessToken
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const result: unknown = await response.json()
        if (typeof result === 'object'
          && result !== null
          && 'languages' in result
          && Array.isArray(result.languages)) {
          const codes: IDBLanguage[] = result.languages.map((lang: SupportedLanguage) => ({ id: lang.code }))
          setLanguages(codes)

          result.languages.forEach((lang: SupportedLanguage) => {
            void IDB.put('languages', {
              id: lang.code
            })
          })
        }
      }
    }
  }, [IDB, session?.accessToken, spellcheckUrl])

  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])

  const languageCodes = useMemo(() => languages.map((l) => l.id), [languages])
  const value = useMemo(() => ({ languages, languageCodes }), [languages, languageCodes])

  return (
    <SupportedLanguagesContext.Provider value={value}>
      {children}
    </SupportedLanguagesContext.Provider>
  )
}
