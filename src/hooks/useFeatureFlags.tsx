import { useMemo } from 'react'
import { useRegistry } from '.'
import type { AllowedFeatureFlag } from 'src/datastore/types'

export const useFeatureFlags = (flags: (keyof AllowedFeatureFlag)[]): AllowedFeatureFlag => {
  const { featureFlags } = useRegistry()

  const returnedFlags = useMemo(() => {
    const resolvedFlags: AllowedFeatureFlag = {}

    flags.forEach((flag) => {
      resolvedFlags[flag] = featureFlags[flag] ?? false
    })

    return resolvedFlags
  }, [flags, featureFlags])

  return returnedFlags
}
