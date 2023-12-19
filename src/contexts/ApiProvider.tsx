import { createContext, useMemo, useState, useEffect } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'

interface ApiProviderProps {
  children: React.ReactNode
}

export interface ApiProviderState {
  apiInitialized: boolean
  websocketUrl: URL
  indexUrl: URL
  hocuspocusWebsocket?: HocuspocusProviderWebsocket
}

export const ApiProviderContext = createContext<ApiProviderState>({
  apiInitialized: false,
  websocketUrl: new URL('http://localhost'),
  indexUrl: new URL('http://localhost'),
  hocuspocusWebsocket: undefined
})

export const ApiProvider = ({ children }: ApiProviderProps): JSX.Element => {
  const [urls, setUrls] = useState<{ websocketUrl: URL, indexUrl: URL }>({ websocketUrl: new URL('http://localhost'), indexUrl: new URL('http://localhost') })
  const [apiInitialized, setApiInitialized] = useState(false)

  useEffect(() => {
    const fetchUrls = async (): Promise<void> => {
      const response = await fetch('/api/init')
      if (response.ok) {
        const urls = await response.json()
        setUrls({ websocketUrl: urls.WS_URL, indexUrl: urls.INDEX_URL })
        setApiInitialized(true)
      }
    }
    void fetchUrls()
  }, [])

  const value = useMemo((): ApiProviderState => {
    return {
      apiInitialized,
      websocketUrl: urls.websocketUrl,
      indexUrl: urls.indexUrl,
      hocuspocusWebsocket: new HocuspocusProviderWebsocket({ url: urls.websocketUrl?.href })
    }
  }, [urls, apiInitialized])

  return (
    <ApiProviderContext.Provider value={value}>
      {!!HocuspocusProvider && children}
    </ApiProviderContext.Provider>
  )
}
