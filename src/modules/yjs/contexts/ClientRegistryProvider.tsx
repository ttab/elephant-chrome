import { type PropsWithChildren, useEffect, useState } from 'react'
import { ClientRegistryContext } from './ClientRegistryContext'
import { useWebSocket } from '../hooks.tsx'
import { CollaborationClientRegistry } from '../classes/CollaborationClientRegistry.ts'

export function ClientRegistryProvider({ accessToken, children }: PropsWithChildren & {
  accessToken?: string | null
}) {
  const { webSocketProvider } = useWebSocket()
  const [registry, setRegistry] = useState<CollaborationClientRegistry | null>(null)

  useEffect(() => {
    if (registry || !webSocketProvider || !accessToken) {
      return
    }

    setRegistry(new CollaborationClientRegistry({
      webSocketProvider,
      accessToken
    }))
  }, [accessToken, webSocketProvider, registry])

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
