import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { DocumentsClient } from '@ttab/elephant-api/repository'
import type { RpcOptions } from '@protobuf-ts/runtime-rpc'

export interface DocumentService {
  /** The Twirp DocumentsClient — call any RPC method directly. */
  client: DocumentsClient
  /** Pre-built RpcOptions with the current session's access token. */
  options: RpcOptions
}

/**
 * Hook that provides the full Twirp Documents service client to plugins.
 * Returns the client and pre-built RpcOptions with the session's access token,
 * so plugins can call e.g. `client.get(request, options)`.
 */
export function useDocumentService(): DocumentService | null {
  const { server } = useRegistry()
  const { data: sessionData } = useSession()

  return useMemo(() => {
    if (!server?.repositoryUrl || !sessionData?.accessToken) {
      return null
    }

    const client = new DocumentsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', server.repositoryUrl).toString(),
        sendJson: true,
        jsonOptions: { ignoreUnknownFields: true },
      })
    )

    const options: RpcOptions = {
      meta: { authorization: `Bearer ${sessionData.accessToken}` },
    }

    return { client, options }
  }, [server?.repositoryUrl, sessionData?.accessToken])
}
