import { useRegistry } from '.'
import type { AllowedFeatureFlag } from 'src/datastore/types'

export const useFeatureFlags = <T extends keyof AllowedFeatureFlag>(
  flags?: readonly T[]
): Pick<AllowedFeatureFlag, T> => {
  const { featureFlags } = useRegistry()

  if (!flags) {
    return featureFlags as Pick<AllowedFeatureFlag, T>
  }

  const resolvedFlags = {} as Pick<AllowedFeatureFlag, T>
  for (const flag of flags) {
    resolvedFlags[flag] = featureFlags[flag] as AllowedFeatureFlag[T]
  }

  return resolvedFlags
}
