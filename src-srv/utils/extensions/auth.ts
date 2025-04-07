import { parseStateless, type StatelessAuth, StatelessType } from '@/shared/stateless.js'
import type { User } from '@auth/express'
import {
  type onStatelessPayload,
  type Extension,
  type onAuthenticatePayload
} from '@hocuspocus/server'
import { decodeJwt } from 'jose'
import { type JWT } from '@auth/core/jwt'

export class Auth implements Extension {
  async onAuthenticate({ token: accessToken }: onAuthenticatePayload): Promise<{
    accessToken: string
    user: JWT
  }> {
    const isValidAccessToken = await validateAccessToken(accessToken)

    if (isValidAccessToken) {
      return {
        accessToken,
        user: { ...decodeJwt(accessToken) }
      }
    }

    throw new Error('Could not authenticate: Invalid accessToken')
  }

  async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    const statelessMessage = parseStateless<StatelessAuth>(payload)

    if (statelessMessage.type === StatelessType.AUTH) {
      if (await validateAccessToken(statelessMessage.message.accessToken)) {
        (connection.context as { accessToken: string })
          .accessToken = statelessMessage.message.accessToken;
        (connection.context as { user: User })
          .user = { ...decodeJwt(statelessMessage.message.accessToken) }
      } else {
        throw new Error('Could not authenticate: Invalid new accessToken')
      }
    }
  }
}

async function validateAccessToken(accessToken: string): Promise<boolean> {
  const response = await fetch(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  return response.ok
}
