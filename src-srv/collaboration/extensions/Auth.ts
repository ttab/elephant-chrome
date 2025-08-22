import { parseStateless, type StatelessAuth, StatelessType } from '@/shared/stateless.js'
import type { User } from '@auth/express'
import {
  type onStatelessPayload,
  type Extension,
  type onAuthenticatePayload
} from '@hocuspocus/server'
import { decodeJwt } from 'jose'
import { type JWT } from '@auth/core/jwt'
import type { OidcConfig } from '../../utils/authConfig.js'

export class Auth implements Extension {
  oidc: OidcConfig

  constructor(oidcConf: OidcConfig) {
    this.oidc = oidcConf
  }

  async onAuthenticate({ token: accessToken }: onAuthenticatePayload): Promise<{
    agent: string
    accessToken: string
    user: JWT
  }> {
    const isValidAccessToken = await this.validateAccessToken(accessToken)

    if (isValidAccessToken) {
      return {
        agent: 'user',
        accessToken,
        user: { ...decodeJwt(accessToken) }
      }
    }

    throw new Error('Could not authenticate: Invalid accessToken')
  }

  async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    const statelessMessage = parseStateless<StatelessAuth>(payload)

    if (statelessMessage.type === StatelessType.AUTH) {
      const valid = await this.validateAccessToken(statelessMessage.message.accessToken)

      if (valid) {
        const context = connection.context as {
          accessToken: string
          user: User
        }

        context.accessToken = statelessMessage.message.accessToken
        context.user = { ...decodeJwt(statelessMessage.message.accessToken) }
      } else {
        throw new Error('Could not authenticate: Invalid new accessToken')
      }
    }
  }

  async validateAccessToken(accessToken: string): Promise<boolean> {
    const response = await fetch(this.oidc.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).catch((e) => {
      throw new Error('validate access token', { cause: e })
    })

    return response.ok
  }
}
