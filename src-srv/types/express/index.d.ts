import type { Response as ExpressResponse } from 'express'
import type { ServerSession } from '../../utils/sessionMiddleware.js'


export interface Response extends ExpressResponse {
  locals: {
    session: ServerSession
  }
}
