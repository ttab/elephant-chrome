import { useMemo } from 'react'
import { useRegistry } from '.'

export const useFeatureFlags = (flags: string[]) => {
  const { featureFlags } = useRegistry()

  const returnedFlags = useMemo(() => {
    const resolvedFlags: Record<string, boolean> = {}

    flags.forEach((flag) => {
      if (featureFlags[flag]) {
        resolvedFlags[flag] = featureFlags[flag]
      }
    })

    return resolvedFlags
  }, [flags, featureFlags])

  return returnedFlags
}
