import {
  type ContentState,
  type ViewRegistry
} from '@/types'

import { getScreenDefinitions } from '@/lib/getScreenDefinitions'

const screenDefinitions = getScreenDefinitions()

// Calculate how much space (columns in grid) the content requires as a minimum
export function minimumSpaceRequired(
  content: ContentState[],
  viewRegistry: ViewRegistry
): number {
  // Default to biggest screen, then find biggest screen size allowed
  let screen = screenDefinitions.slice(-1)[0]
  const filteredScreens = screenDefinitions.filter((s) => {
    return s.value > window.innerWidth
  }).reverse()

  // Find the smallest defined screen size that can handle current screen width
  if (filteredScreens.length) {
    screen = filteredScreens.slice(-1)[0]
  }

  const views = content
    .filter((item) => !!item.name)
    .map((item): { name: string, width: number } => {
      const name = item.name
      return {
        name,
        width: viewRegistry.get(name).meta.widths[screen.key]
      }
    })

  return views.reduce((total, view) => {
    return view.width + total
  }, 0)
}
