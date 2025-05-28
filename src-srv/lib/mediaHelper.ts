import { pipeline } from 'stream/promises'
import type { Response } from 'express'
import type { User } from '@auth/express'

type Session = { accessToken?: string | undefined, user?: User } | undefined

export const mediaHelper = async ({ url, query, session, res }: { url: URL, query: unknown, session: Session, res: Response }) => {
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === 'string') url.searchParams.set(key, value)
    })
  }

  if (!session?.accessToken || !session?.user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not stream image'
    }
  }

  const imageRes = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  })

  if (!imageRes.ok || imageRes.status >= 400) {
    return {
      statusCode: imageRes.status,
      statusMessage: imageRes.statusText
    }
  }

  const contentType = imageRes.headers.get('content-type')
  if (contentType) res.setHeader('Content-Type', contentType)
  const contentLength = imageRes.headers.get('content-length')
  if (contentLength) res.setHeader('Content-Length', contentLength)

  if (!imageRes.body) {
    return {
      statusCode: 500,
      statusMessage: 'Failed to stream image'
    }
  }

  try {
    await pipeline(imageRes.body, res)
  } catch (ex) {
    if (ex instanceof Error) {
      return {
        statusCode: 500,
        statusMessage: ex.message
      }
    }
    return {
      statusCode: 500,
      statusMessage: 'Unknown error while streaming image'
    }
  }

  return {
    statusCode: 202,
    statusMessage: 'OK'
  }
}
