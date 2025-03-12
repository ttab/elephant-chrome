import type { View } from '@/types/index'

export const currentView = (): { name: View, props: Record<string, string> } => {
  let name: View | undefined

  if (window.location.pathname !== import.meta.env.BASE_URL
    && window.location.pathname !== import.meta.env.BASE_URL + '/') {
    const nameFromPath = window.location.pathname
      .replace(import.meta.env.BASE_URL, '')
      .replace(/\/$/, '')

    if (nameFromPath[1]) {
      name = nameFromPath[1]?.toUpperCase() + nameFromPath.slice(2)
    }
  } else {
    name = 'Plannings'
  }

  const props = Object.fromEntries(new URLSearchParams(window.location.search))

  return {
    name: name || 'Plannings',
    props: props || {}
  }
}
