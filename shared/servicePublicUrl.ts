export type ServicePublicUrlOverrides = Record<string, string>

/**
 * Resolve a service's public URL by logical name.
 *
 * - If `overrides[name]` is set, returns it verbatim.
 * - Otherwise returns `basePublicApiUrl` with `${name}.` prepended to its host.
 *   E.g. ('repository', 'https://api.example.com') → 'https://repository.api.example.com/'.
 */
export function resolveServicePublicUrl(
  name: string,
  basePublicApiUrl: string,
  overrides: ServicePublicUrlOverrides = {}
): string {
  const override = overrides[name]
  if (override) {
    return override
  }

  if (!basePublicApiUrl) {
    throw new Error(`basePublicApiUrl is required to resolve ${name} public URL`)
  }

  const url = new URL(basePublicApiUrl)
  url.host = `${name}.${url.host}`
  return url.toString()
}
