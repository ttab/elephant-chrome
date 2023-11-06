import { createContext, useMemo } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'

interface ApiProviderProps {
  children: React.ReactNode
  apiUrl: URL
  websocketUrl: URL
}

export interface ApiProviderState {
  apiUrl: URL
  websocketUrl: URL
  hocuspocusWebsocket?: HocuspocusProviderWebsocket
}

export const ApiProviderContext = createContext<ApiProviderState>({
  apiUrl: new URL('http://localhost'),
  websocketUrl: new URL('http://localhost'),
  hocuspocusWebsocket: undefined
})

export const ApiProvider = ({ children, apiUrl, websocketUrl }: ApiProviderProps): JSX.Element => {
  const hpws = useMemo(() => {
    return new HocuspocusProviderWebsocket({ url: websocketUrl.href })
  }, [websocketUrl])

  const value = {
    apiUrl,
    websocketUrl,
    hocuspocusWebsocket: hpws
  }

  return (
    <ApiProviderContext.Provider value={value}>
      {!!HocuspocusProvider && children}
    </ApiProviderContext.Provider>
  )
}
