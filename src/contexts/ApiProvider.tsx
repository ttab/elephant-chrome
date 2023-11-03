import { createContext, useMemo } from 'react'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'

interface ApiProviderProps {
  children: React.ReactNode
  apiUrl: string
  websocketUrl: string
}

export interface ApiProviderState {
  apiUrl: string
  websocketUrl: string
  hocuspocusWebsocket?: HocuspocusProviderWebsocket
}

export const ApiProviderContext = createContext<ApiProviderState>({
  apiUrl: '',
  websocketUrl: '',
  hocuspocusWebsocket: undefined
})

export const ApiProvider = ({ children, apiUrl, websocketUrl }: ApiProviderProps): JSX.Element => {
  const hpws = useMemo(() => {
    return new HocuspocusProviderWebsocket({ url: websocketUrl })
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
