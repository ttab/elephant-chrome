import type { Request } from 'express'
import type { RouteHandler } from '../../routes.js'
import { getContextFromValidSession, isContext } from '../../lib/context.js'

/**
 * Proxy translation requests to the NTB twirp service.
 */
export const POST: RouteHandler = async (req: Request, { res, serviceUrls }) => {
  const nynorskUrl = serviceUrls.resolveServiceUrl('ntb', 'internal')

  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: { sub: string } } | undefined

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }

  const body = req.body as Record<string, unknown>

  if (!body.texts && !body.text) {
    return { statusCode: 400, statusMessage: 'Missing text or texts field' }
  }

  const twirpUrl = new URL('twirp/ttab.ntb.Nynorsk/Translate', nynorskUrl).toString()

  let response: Response
  try {
    response = await fetch(twirpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${context.accessToken}`
      },
      body: JSON.stringify(body)
    })
  } catch (ex) {
    const message = ex instanceof Error ? ex.message : 'Unknown network error'
    return { statusCode: 502, statusMessage: `Translation service unreachable: ${message}` }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    return { statusCode: response.status, statusMessage: `Translation failed: ${text}` }
  }

  const result = await response.json() as Record<string, unknown>
  return { payload: result }
}
