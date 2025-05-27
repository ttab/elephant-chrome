import type { Context } from '../../../lib/assertContext.js'
import { mediaHelper } from '../../../lib/mediaHelper.js'
import type { RouteHandler } from '../../../routes.js'

export const GET: RouteHandler = async (req, { res }) => {
  const GRAPHIC_BASE_URL = process.env.GRAPHIC_BASE_URL
  const params = req.params.url
  const query = req.query
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined
  const url = new URL(`https://${GRAPHIC_BASE_URL}/${params}`)

  return await mediaHelper({ url, query, session, res })
}
