import { useCollaboration, useYValue } from '@/hooks'
import { TriangleAlert } from '@ttab/elephant-ui/icons'
import { useEffect, useMemo } from 'react'
import type { OnValidation } from './Form/Root'
import { type FormProps } from './Form/Root'

export const Validation = ({ children, path, label, block, compareValues, onValidation, validateStateRef }: {
  path: string
  label: string
  block: string
  compareValues?: string[]
  onValidation?: (args: OnValidation) => boolean
} & FormProps): JSX.Element | null => {
  const [value] = useYValue<string | undefined>(path)
  const { synced } = useCollaboration()

  const isValid = useMemo(() => {
    return onValidation
      ? onValidation({ block, label, value, compareValues, reason: 'cannot be empty' })
      : true
  }, [value, onValidation, label, block, compareValues])

  // Remove validation state from the ref when the component unmounts
  useEffect(() => {
    return () => {
      if (validateStateRef?.current[block]) {
        validateStateRef.current = Object.fromEntries(
          Object.entries(validateStateRef.current)
            .filter(([key]) => key !== block)
        )
      }
    }
  }, [block, validateStateRef])


  return (
    <div className='w-full relative flex items-center'>
      {!isValid && synced && (
        <div className='absolute -top-1 right-0 h-2 w-2 z-10'>
          <TriangleAlert color='red' fill='#ffffff' size={15} strokeWidth={1.75} />
        </div>
      )}
      <div data-ele-validation={!!onValidation} className='flex flex-col w-full'>
        {children}
      </div>
    </div>
  )
}

