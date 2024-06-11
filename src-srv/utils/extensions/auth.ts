import {
  type Extension,
  type onAuthenticatePayload
} from '@hocuspocus/server'
import { type JWTPayload, decodeJwt } from 'jose'

export class Auth implements Extension {
  async onAuthenticate({ token }: onAuthenticatePayload): Promise<{
    token: string
    user: JWTPayload
  }> {
    /* try {
      await this.configuration.validateToken(token)
    } catch (ex) {
      throw new Error('Could not authenticate', { cause: ex })
    } */

    return {
      token,
      user: { ...decodeJwt(token) }
    }
  }

  /* async onStateless({ payload, connection }: onStatelessPayload): Promise<void> {
    try {
      const statelessMessage = parseStateless<StatelessAuth>(payload)
      if (statelessMessage.type === StatelessType.AUTH) {
        await this.configuration.validateToken(statelessMessage.message.token)
      }

      // Set new JWT in connection context
      connection.context = statelessMessage.message
    } catch (ex) {
      throw new Error('Could not authenticate, token not refreshed', { cause: ex })
    }
  } */
}
