import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string | undefined
    refreshToken: string | undefined
    accessTokenExpires: number
    expires: string
    status: 'authenticated' | 'unauthenticated' | 'loading'
    user: {
      name: string
      email: string
      image: string
      id: string
    }
  }
}
