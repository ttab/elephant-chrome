import type { User } from '@auth/express'
import type {
  onTokenSyncPayload
} from '@hocuspocus/server'
import {
  type Extension,
  type onAuthenticatePayload
} from '@hocuspocus/server'
import type { FlattenedJWSInput, GetKeyFunction, JWTHeaderParameters, JWTPayload, JWTVerifyOptions } from 'jose'
import { jwtVerify } from 'jose'
import { type JWT } from '@auth/core/jwt'
import { JWTClaimValidationFailed, JWTExpired } from 'jose/errors'

interface KeycloakJWTPayload extends JWTPayload {
  sub: string
  name?: string
  email?: string
  roles?: string[]
}

export interface AuthConfiguration {
  jwks: GetKeyFunction<JWTHeaderParameters, FlattenedJWSInput>
  verifyOptions: JWTVerifyOptions
}

export class Auth implements Extension {
  jwks: GetKeyFunction<JWTHeaderParameters, FlattenedJWSInput>
  verifyOptions: JWTVerifyOptions

  constructor(configuration: AuthConfiguration) {
    this.jwks = configuration.jwks
    this.verifyOptions = configuration.verifyOptions
  }

  async onAuthenticate({ token: accessToken }: onAuthenticatePayload): Promise<{
    agent: string
    accessToken: string
    user: JWT
  }> {
    const jwt = await this.validateAccessToken(accessToken)

    return {
      agent: 'user',
      accessToken,
      user: jwt
    }
  }

  async onTokenSync({ token, connection }: onTokenSyncPayload) {
    if (!token) {
      throw new Error('No token provided for sync')
    }

    try {
      // Verify the new token
      const jwt = await this.validateAccessToken(token)

      const context = connection.context as {
        accessToken: string
        user: User
      }

      context.accessToken = token
      context.user = jwt

      return { lastTokenSync: new Date() }
    } catch (err) {
      throw new Error(`Token sync failed: ${(err as Error).message}`)
    }
  }

  async validateAccessToken(accessToken: string) {
    try {
      const jwt = await jwtVerify<KeycloakJWTPayload>(accessToken, this.jwks, this.verifyOptions)
      return jwt.payload
    } catch (e) {
      if (e instanceof JWTExpired || e instanceof JWTClaimValidationFailed) {
        throw new Error('Could not authenticate: Invalid new accessToken')
      }
      throw new Error('validate access token', { cause: e })
    }
  }
}
