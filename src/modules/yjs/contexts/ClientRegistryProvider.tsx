import { type PropsWithChildren, useEffect, useState } from 'react'
import { ClientRegistryContext } from './ClientRegistryContext'
import { useWebSocket } from '../hooks.tsx'
import { CollaborationClientRegistry } from '../classes/CollaborationClientRegistry.ts'

export function ClientRegistryProvider({ accessToken, children }: PropsWithChildren & {
  accessToken?: string | null
}) {
  const { webSocketProvider: websocketProvider } = useWebSocket()
  const [registry, setRegistry] = useState<CollaborationClientRegistry | null>(null)

  useEffect(() => {
    if (registry || !websocketProvider || !accessToken) {
      return
    }

    setRegistry(new CollaborationClientRegistry({
      webSocketProvider: websocketProvider,
      accessToken
    }))
  }, [accessToken, websocketProvider, registry])

  useEffect(() => {
    if (registry && accessToken) {
      registry.updateAccessToken(accessToken)
    }
  }, [accessToken, registry])

  return (
    <ClientRegistryContext.Provider value={{ registry }}>
      {children}
    </ClientRegistryContext.Provider>
  )
}
