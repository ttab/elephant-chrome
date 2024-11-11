import { useCollaboration, useYValue } from '@/hooks'
import { TriangleAlert } from '@ttab/elephant-ui/icons'
import { useEffect, useMemo } from 'react'
import { type FormProps } from './Form/Root'

export const Validation = ({ children, path, label, block, onValidation, validateStateRef }: {
  path: string
  label: string
  block: string
  onValidation?: (block: string, label: string, value: string | undefined, reason: string) => boolean
} & FormProps): JSX.Element | null => {
  const [value] = useYValue<string | undefined>(path)
  const { synced } = useCollaboration()

  const isValid = useMemo(() => {
    return onValidation
      ? onValidation(block, label, value, 'cannot be empty')
      : true
  }, [value, onValidation, label, block])

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


  return synced && !isValid
    ? (
        <div className='relative flex items-center'>
          <div className='absolute -top-1 right-0 h-2 w-2 z-10'>
            <TriangleAlert color='red' fill='#ffffff' size={15} strokeWidth={1.75} />
          </div>
          <div data-ele-validation={!!onValidation} className='flex flex-col w-full'>
            {children}
          </div>
        </div>
      )
    : <div className='flex items-center'>{children}</div>
}
