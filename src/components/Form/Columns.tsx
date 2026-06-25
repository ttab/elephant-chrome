import { type JSX, type ReactNode } from 'react'
import { type FormProps } from './Root'
import { cloneChildrenWithProps } from './lib/cloneChildren'

/**
 * Two-column form layout that keeps the form-prop propagation chain intact.
 *
 * Plain wrapper <div>s drop the injected onValidation/validateStateRef props, which
 * silently disables field validation (e.g. Section/Newsvalue no longer being mandatory).
 * Form.Columns forwards those props to its children just like Form.Content/Form.Group do,
 * so validation-aware fields nested in the right column keep registering themselves.
 *
 * - `left`: presentational main content (descriptions etc.) that does not register validation.
 * - `children`: the compact metadata column whose fields participate in validation.
 */
export const Columns = ({
  left,
  children,
  asDialog,
  onValidation,
  validateStateRef,
  onChange
}: FormProps & {
  left?: ReactNode
}): JSX.Element => {
  const formProps: Partial<FormProps> = { asDialog, onValidation, validateStateRef, onChange }

  return (
    <div className='@container w-full'>
      <div className='grid grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-4'>
        <div className='flex flex-col gap-4'>
          {left}
        </div>

        <div className='flex flex-col gap-4'>
          {cloneChildrenWithProps<FormProps>(children, formProps)}
        </div>
      </div>
    </div>
  )
}
