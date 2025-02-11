import 'express'
import type { Session } from 'next-auth'

declare module 'express' {
  export interface Response {
    locals: {
      session: Session
    }
  }
}
