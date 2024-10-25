import { type User as NextAuthUser, type JWT as NextAuthJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
    expires: string
    status: 'authenticated' | 'unauthenticated' | 'loading'
    user: {
      name: string
      email: string
      image: string
      id: string
      sub: string
    }
    error: string
  }
  interface User extends NextAuthUser {
    sub?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    sub: number
  }
}
