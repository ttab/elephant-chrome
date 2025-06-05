import type { Context } from '../../../lib/assertContext.js'
import { mediaHelper } from '../../../lib/mediaHelper.js'
import type { RouteHandler } from '../../../routes.js'

export const GET: RouteHandler = async (req, { res }) => {
  const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL
  const params = req.params.url
  const url = new URL(`${IMAGE_BASE_URL}/${params}`)
  const query = req.query
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined

  return await mediaHelper({ url, query, session, res })
}
