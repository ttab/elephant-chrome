import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport'
import { CommentsClient } from '@ttab/elephant-tt-api/intelligence'
import type { RpcOptions } from '@protobuf-ts/runtime-rpc'

export interface CommentService {
  /** The Twirp CommentsClient — call any RPC method directly. */
  client: CommentsClient
  /** Pre-built RpcOptions with the current session's access token. */
  options: RpcOptions
}

/**
 * Hook that provides the Twirp Comments service client to plugins.
 * Returns the client and pre-built RpcOptions with the session's access token.
 */
export function useCommentService(): CommentService | null {
  const { server } = useRegistry()
  const { data: sessionData } = useSession()

  return useMemo(() => {
    if (!server?.intelligenceUrl || !sessionData?.accessToken) {
      return null
    }

    const client = new CommentsClient(
      new TwirpFetchTransport({
        baseUrl: new URL('twirp', server.intelligenceUrl).toString(),
        sendJson: true,
        jsonOptions: { ignoreUnknownFields: true },
      })
    )

    const options: RpcOptions = {
      meta: { authorization: `Bearer ${sessionData.accessToken}` },
    }

    return { client, options }
  }, [server?.intelligenceUrl, sessionData?.accessToken])
}
