import tailwindConfig from '@ttab/elephant-ui/styles/presetResolved.json'

export interface ScreenDefinition {
  key: string
  value: number
}

/**
 * Get screen size definitions from tailwind configuration
 *
 * @returns Array<{ key: string, value: number }>
 */
export function getScreenDefinitions(): ScreenDefinition[] {
  const definedScreens = tailwindConfig.theme.screens as Record<string, string>
  const screens: Array<{ key: string, value: number }> = []

  for (const key of Object.keys(definedScreens)) {
    screens.push({
      key,
      value: parseInt(definedScreens[key])
    })
  }

  return screens.sort((s1, s2) => {
    return s1.value >= s2.value ? 1 : -1
  })
}
