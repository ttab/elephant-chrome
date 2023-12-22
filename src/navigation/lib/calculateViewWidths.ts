import {
  type ContentState,
  type ViewRegistry
} from '@/types'

import {
  type ScreenDefinition,
  getScreenDefinitions
} from '@/lib/getScreenDefinitions'

/**
 * Calculate each views colSpan that is in the current content
 *
 * @param viewRegistry ViewRegistry
 * @param content ContentState[]
 * @returns Array<{ name: string, colSpan: number }>
 */
export function calculateViewWidths(
  viewRegistry: ViewRegistry,
  content: ContentState[]
): Array<{ name: string, colSpan: number }> {
  const screenDefinitions = getScreenDefinitions()

  return calculateViewColSpans(viewRegistry, screenDefinitions, content)
}

function calculateViewColSpans(
  viewRegistry: ViewRegistry,
  screenDefinitions: ScreenDefinition[],
  content: ContentState[]
): Array<{ name: string, colSpan: number }> {
  let screen = screenDefinitions[screenDefinitions.length - 1]
  const screens = screenDefinitions.filter(s => {
    return s.value > window.innerWidth
  }).reverse()

  // Find the smallest defined screen size that can handle current screen width
  if (screens.length) {
    screen = screens[screens.length - 1]
  }

  // Extracts all current views based from components content as name/wanted minimum width
  const views = content
    .filter(item => !!item.name) // Happens during init phase
    .map((item): { name: string, width: number } => {
      const name = item.name
      return {
        name,
        width: viewRegistry.get(name).meta.widths[screen.key]
      }
    })

  // Happens during init phase
  if (!views.length) {
    return []
  }

  // Calculate total requested minimum colSpan
  const usedSpace = views.reduce((total, view) => {
    return view.width + total
  }, 0)

  // Calculate what colSpan each view is assigned
  const widths = views.map(view => {
    return {
      name: view.name,
      colSpan: Math.floor(12 * (view.width / usedSpace))
    }
  })

  // Assign extra space left to the last view so it expands if necessary
  const usedColSpan = widths.reduce((total, item) => { return item.colSpan + total }, 0)
  if (usedColSpan < 12) {
    widths[widths.length - 1].colSpan += 12 - usedColSpan
  }

  return widths
}
