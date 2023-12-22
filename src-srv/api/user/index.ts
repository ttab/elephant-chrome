import { decodeJwt } from 'jose'
import type { Response } from 'express'
import type { RouteHandler } from '../../routes.js'
import type { Session } from '../../utils/Repository.js'

export const POST: RouteHandler = async (req, context) => {
  const { repository, res } = context

  const {
    user,
    password,
    sub = 'AB' // FIXME: Remove hardcoded value, should come from somewhere
  } = req.body

  const permissions = [
    'doc_read',
    'doc_write',
    'doc_del',
    'search'
  ].join(' ')

  try {
    console.log(user, password)
    const session = await repository.auth({ user, password, sub, permissions })
    const jwt = decodeJwt(session.access_token)
    setCookies(session, res)

    return {
      payload: {
        ...jwt,
        access_token: session.access_token
      }
    }
  } catch (ex) {
    if (ex instanceof Error) {
      return {
        statusCode: 401,
        statusMessage: ex.message
      }
    }
    return {
      statusCode: 401,
      statusMessage: 'Unexpected error when authenticating'
    }
  }
}

export const GET: RouteHandler = async (req, { repository, res }) => {
  const accessToken: string = req.cookies['ele-access_token']
  const refreshToken: string = req.cookies['ele-refresh_token']

  if (accessToken === undefined) {
    return {
      statusCode: 401,
      statusMessage: 'Not authorized'
    }
  }

  try {
    await repository.validateToken(accessToken)
    const jwt = decodeJwt(accessToken)
    const session = await repository.refresh({ refreshToken })
    setCookies(session, res)

    jwt.exp = new Date().getTime() + session.expires_in
    jwt.accessToken = session.access_token

    return {
      payload: {
        ...jwt,
        access_token: session.access_token
      }
    }
  } catch (ex) {
    return {
      statusCode: 401,
      statusMessage: 'Not authorized'
    }
  }
}

function setCookies(session: Session, res: Response): void {
  res.cookie(
    'ele-access_token',
    session.access_token,
    {
      maxAge: session.expires_in * 1000,
      secure: true,
      sameSite: 'strict'
    }
  )

  res.cookie(
    'ele-refresh_token',
    session.refresh_token,
    {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    }
  )
}
