/**
 * Best-effort detection of whether the current browser is running on macOS.
 *
 * Prefers the modern `navigator.userAgentData.platform` (where available),
 * then falls back to the deprecated `navigator.platform`, and finally to
 * `navigator.userAgent` so we still get a reasonable answer in older
 * Chromium and non-Chromium engines.
 */
export function isMacOs(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const navigatorModernApi = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  let platform: string | undefined

  if (
    'userAgentData' in navigatorModernApi
    && typeof navigatorModernApi.userAgentData?.platform === 'string'
  ) {
    platform = navigatorModernApi.userAgentData.platform
  }

  if (!platform && typeof navigator.platform === 'string') {
    platform = navigator.platform
  }

  if (!platform) {
    platform = navigator.userAgent
  }

  return /\bmac/i.test(platform)
}
