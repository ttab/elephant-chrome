import { decodeJwt } from 'jose'
import type { Response } from 'express'
import type { RouteHandler } from 'routes.ts'
import type { Session } from 'utils/Repository.ts'

export const POST: RouteHandler = async (req, context) => {
  const { repository, res } = context

  const {
    user = 'Danne Lundqvist', // FIXME: Remove hardcoded value
    password = 'xd3SOkyXUoA2dMPmKMziuoWDkxt6SqU9', // FIXME: Remove hardcoded value
    sub = 'abc' // FIXME: Remove hardcoded value, should come from somewhere
  } = req.body

  const permissions = [
    'doc_read',
    'doc_write',
    'doc_del'
  ].join(' ')

  try {
    const session = await repository.auth({ user, password, sub, permissions })
    if (!setAccessToken(session, res)) {
      return {
        statusCode: 401,
        statusMessage: 'Not authorized'
      }
    }

    return {
      payload: session
    }
  } catch (ex) {
    return {
      statusCode: 500,
      statusMessage: ex.message || 'Unexpected error when authenticating'
    }
  }
}

export const GET: RouteHandler = async (req, { repository, res }) => {
  const accessToken: string = req.cookies['ele-access_token']
  const refreshToken: string = req.cookies['ele-refresh_token']

  // No token equals Unauthorized
  if (accessToken === undefined) {
    return {
      statusCode: 401,
      statusMessage: 'Not authorized'
    }
  }

  try {
    await repository.validateToken(accessToken)
    const session = decodeJwt(accessToken)

    return {
      payload: {
        ...session,
        accessToken,
        refreshToken
      }
    }
  } catch (ex) {
    console.log(ex)
  }

  try {
    console.info('Refreshing token...')

    const session = await repository.refresh({ refreshToken })
    if (!setAccessToken(session, res)) {
      return {
        statusCode: 401,
        statusMessage: 'Not authorized'
      }
    }

    return {
      payload: {
        ...session,
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      }
    }
  } catch (ex) {
    console.error('Failed refreshing token')
    throw (ex)
  }
}


export function setAccessToken(session: Session, res: Response): boolean {
  const {
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: refreshToken
  } = session

  if (!accessToken) {
    return false
  }

  res.cookie('ele-access_token', accessToken, { maxAge: expiresIn * 1000 })
  res.cookie('ele-refresh_token', refreshToken, {
    httpOnly: true,
    secure: true
  })

  return true
}
