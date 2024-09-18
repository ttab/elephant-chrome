import { parseStateless, type StatelessAuth, StatelessType } from '@/shared/stateless.js'
import {
  type onStatelessPayload,
  type Extension,
  type onAuthenticatePayload
} from '@hocuspocus/server'
import { type JWTPayload, decodeJwt } from 'jose'

export class Auth implements Extension {
  async onAuthenticate({ token }: onAuthenticatePayload): Promise<{
    token: string
    user: JWTPayload
  }> {
    console.log(token)
    const isValidToken = await validateAccessToken(token)

    if (isValidToken) {
      return {
        token,
        user: { ...decodeJwt(token) }
      }
    }

    throw new Error('Could not authenticate: Invalid token')
  }

  async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    const statelessMessage = parseStateless<StatelessAuth>(payload)
    if (statelessMessage.type === StatelessType.AUTH) {
      if (await validateAccessToken(statelessMessage.message.token)) {
        connection.context = statelessMessage.message
      } else {
        throw new Error('Could not authenticate: Invalid new token')
      }
    }
  }
}

async function validateAccessToken(token: string): Promise<boolean> {
  const response = await fetch(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return response.ok
}
