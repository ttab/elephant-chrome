import { createContext, useCallback, useEffect, useState } from 'react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { type IDBLanguage } from '../types'

interface SupportedLanguagesProviderState {
  languages: IDBLanguage[]
}

export const SupportedLanguagesContext = createContext<SupportedLanguagesProviderState>({
  languages: []
})

export const SupportedLanguagesProvider = ({ children }: {
  children: React.ReactNode
}) => {
  const { data: session } = useSession()
  const [languages, setLanguages] = useState<IDBLanguage[]>([])
  const IDB = useIndexedDB()
  const { server: { spellcheckUrl } } = useRegistry()
  const getOrRefreshCache = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !spellcheckUrl || !IDB.db) {
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
          setLanguages(result.languages)
          result.languages.forEach((lang: IDBLanguage, index: number) => {
            void IDB.put('languages', {
              id: `supported_language_${index + 1}`,
              code: lang.code
            })
          })
        }
      }
    }
  }, [IDB, session?.accessToken, spellcheckUrl])

  useEffect(() => {
    void getOrRefreshCache()
  }, [getOrRefreshCache])

  return (
    <SupportedLanguagesContext.Provider value={{ languages }}>
      {children}
    </SupportedLanguagesContext.Provider>
  )
}
