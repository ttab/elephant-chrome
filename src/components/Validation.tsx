import { useCollaboration, useYValue } from '@/hooks'
import { useMemo } from 'react'

export const Validation = ({ path, label, block, onValidation }: {
  path: string
  label: string
  block: string
  onValidation: (block: string, label: string, value: string | undefined, reason: string) => boolean
}): JSX.Element | null => {
  const [value] = useYValue<string | undefined>(path)
  const { synced } = useCollaboration()

  const isValid = useMemo(() => {
    return onValidation(block, label, value, 'cannot be empty')
  }, [value, onValidation, label, block])

  return (

    <span className='text-red-400 font-medium text-xs'>
      {synced && !isValid
        ? <>{label} saknas</>
        : <>&nbsp;</>
      }
    </span>
  )
}
