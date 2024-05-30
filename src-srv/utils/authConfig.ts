import { type AuthConfig } from '@auth/core'
import Keycloak from '@auth/express/providers/keycloak'

export const authConfig: AuthConfig = {
  providers: [Keycloak],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken
        }
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    redirect: async ({ url, baseUrl }) => {
      return await Promise.resolve(process.env.BASE_URL
        ? `${baseUrl}${process.env.BASE_URL}`
        : url)
    }
  }

}
