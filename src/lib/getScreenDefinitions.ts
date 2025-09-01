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
  const definedScreens: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    fhd: '1920px',
    qhd: '2560px',
    uhd: '3840px'
  }
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
