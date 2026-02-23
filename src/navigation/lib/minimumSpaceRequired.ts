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
  // Find the largest defined breakpoint that does not exceed the current viewport
  const filteredScreens = screenDefinitions.filter((s) => s.value <= window.innerWidth)
  const screen = filteredScreens.length
    ? filteredScreens[filteredScreens.length - 1]
    : screenDefinitions[0]

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
