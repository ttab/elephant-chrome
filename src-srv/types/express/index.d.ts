import type { Response as ExpressResponse } from 'express'
import type { Session } from 'next-auth'


export interface Response extends ExpressResponse {
  locals: {
    session: Session
  }
}
