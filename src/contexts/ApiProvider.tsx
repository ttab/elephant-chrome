import { createContext, useMemo } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'

interface ApiProviderProps {
  children: React.ReactNode
  apiUrl: URL
  websocketUrl: URL
  indexUrl: URL
}

export interface ApiProviderState {
  apiUrl: URL
  websocketUrl: URL
  indexUrl: URL
  hocuspocusWebsocket?: HocuspocusProviderWebsocket
}

export const ApiProviderContext = createContext<ApiProviderState>({
  apiUrl: new URL('http://localhost'),
  websocketUrl: new URL('http://localhost'),
  indexUrl: new URL('http://localhost'),
  hocuspocusWebsocket: undefined
})

export const ApiProvider = ({ children, apiUrl, websocketUrl, indexUrl }: ApiProviderProps): JSX.Element => {
  const value = useMemo((): ApiProviderState => {
    return {
      apiUrl,
      websocketUrl,
      indexUrl,
      hocuspocusWebsocket: new HocuspocusProviderWebsocket({ url: websocketUrl.href })
    }
  }, [apiUrl, websocketUrl, indexUrl])

  return (
    <ApiProviderContext.Provider value={value}>
      {!!HocuspocusProvider && children}
    </ApiProviderContext.Provider>
  )
}
