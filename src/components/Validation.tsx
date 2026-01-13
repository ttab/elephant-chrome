import { TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import { useEffect, useMemo, type JSX } from 'react'
import type { OnValidation } from './Form/Root'
import { type FormProps } from './Form/Root'
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Validation = (props: {
  ydoc: YDocument<Y.Map<unknown>>
  rootMap?: Y.Map<unknown>
  path: string
  label: string
  block: string
  compareValues?: string[]
  onValidation?: (args: OnValidation) => boolean
} & FormProps): JSX.Element | null => {
  const { ydoc, rootMap, children, path, label, block, compareValues, onValidation, validateStateRef } = props
  const [value] = useYValue<string | undefined>(rootMap ?? ydoc.ele, path)
  const { synced } = ydoc

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
          <TriangleAlertIcon color='red' fill='#ffffff' size={15} strokeWidth={1.75} />
        </div>
      )}
      <div data-ele-validation={!!onValidation} className='flex flex-col w-full'>
        {children}
      </div>
    </div>
  )
}
