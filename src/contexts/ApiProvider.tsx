import { createContext, useMemo } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'

interface ApiProviderProps {
  children: React.ReactNode
  websocketUrl: URL
  indexUrl: URL
}

export interface ApiProviderState {
  websocketUrl: URL
  indexUrl: URL
  hocuspocusWebsocket?: HocuspocusProviderWebsocket
}

export const ApiProviderContext = createContext<ApiProviderState>({
  websocketUrl: new URL('http://localhost'),
  indexUrl: new URL('http://localhost'),
  hocuspocusWebsocket: undefined
})

export const ApiProvider = ({ children, websocketUrl, indexUrl }: ApiProviderProps): JSX.Element => {
  const value = useMemo((): ApiProviderState => {
    return {
      websocketUrl,
      indexUrl,
      hocuspocusWebsocket: new HocuspocusProviderWebsocket({ url: websocketUrl.href })
    }
  }, [websocketUrl, indexUrl])

  return (
    <ApiProviderContext.Provider value={value}>
      {!!HocuspocusProvider && children}
    </ApiProviderContext.Provider>
  )
}
