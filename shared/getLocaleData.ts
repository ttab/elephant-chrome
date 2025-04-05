import type { Locale } from 'date-fns'
import { getUserLocale } from 'get-user-locale'
import type { LocaleData } from '@/types'
import { defaultLocale } from '@/defaults/locale'

export { defaultLocale } from '@/defaults/locale'

export const getLocaleData = async (): Promise<LocaleData> => {
  const full = getUserLocale() || defaultLocale.code.full
  const [short] = full.split('-')
  const long = full.replace('-', '')

  try {
    const { default: module } = await import(
      `../node_modules/date-fns/locale/${full}.js`
    ) as { default: Locale }
    return {
      module,
      code: { short, long, full }
    }
  } catch (_) {
    console.warn(`Locale module for "${full}" not found. Falling back to default.`)
    return defaultLocale
  }
}

