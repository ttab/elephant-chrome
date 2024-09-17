import { useCollaboration, useYValue } from '@/hooks'
import { useMemo } from 'react'

export const Validation = ({ path, label, onValidation }: {
  path: string
  label: string
  onValidation: (label: string, value: string | undefined) => boolean
}): JSX.Element | null => {
  const [value] = useYValue<string | undefined>(path)
  const { synced } = useCollaboration()

  const isValid = useMemo(() => {
    return onValidation(label, value)
  }, [value, onValidation, label])

  return synced && !isValid
    ? <span className='text-red-400 font-medium text-xs'>{`${label} måste vara ifylld`}</span>
    : null
}
