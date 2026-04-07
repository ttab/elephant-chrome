import { useEffect, useState } from 'react'
import { useRegistry } from '@/hooks/useRegistry'
import type { SocketStatus } from '@/shared/RepositorySocket'

export function useSocketStatus(): SocketStatus | null {
  const { repositorySocket } = useRegistry()
  const [status, setStatus] = useState<SocketStatus | null>(null)

  useEffect(() => {
    if (!repositorySocket) return
    return repositorySocket.onStatusChange(setStatus)
  }, [repositorySocket])

  return status
}
