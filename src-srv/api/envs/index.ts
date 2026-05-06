import type { RouteHandler } from '../../routes.js'

export const GET: RouteHandler = (_req, { serviceUrls }) => {
  return Promise.resolve({
    payload: {
      basePublicApiUrl: serviceUrls.getBasePublicApiUrl(),
      servicePublicUrlOverrides: serviceUrls.getPublicUrlOverrides(),
      webSocketUrl: process.env.WS_URL ?? '',
      imageSearchUrl: process.env.IMAGE_SEARCH_PUBLIC_URL ?? process.env.IMAGE_SEARCH_URL ?? '',
      imageSearchProvider: process.env.IMAGE_SEARCH_PROVIDER ?? '',
      faroUrl: process.env.FARO_PUBLIC_URL ?? process.env.FARO_URL ?? '',
      systemLanguage: process.env.SYSTEM_LANGUAGE ?? '',
      hasPrint: process.env.HAS_PRINT ?? '',
      hasHast: process.env.HAS_HAST ?? '',
      hasLooseSlugline: process.env.HAS_LOOSE_SLUGLINE ?? '',
      environment: process.env.ENVIRONMENT ?? ''
    }
  })
}
