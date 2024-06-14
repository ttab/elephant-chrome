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
    return {
      token,
      user: { ...decodeJwt(token) }
    }
  }
}
