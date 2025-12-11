import { type JSX } from 'react'
import { type FormProps } from './Root'
import { cn } from '@ttab/elephant-ui/utils'
import { cloneChildrenWithProps } from './lib/cloneChildren'

export const Footer = ({ children, asDialog, setValidateForm, validateStateRef, className, onValidation }:
  FormProps & {
    className?: string
  }): JSX.Element | null => {
  if (!asDialog) return null

  return (
    <div className={cn('border-t p-5', className)}>
      {cloneChildrenWithProps<FormProps>(children, {
        setValidateForm,
        validateStateRef,
        asDialog,
        onValidation
      })}
    </div>
  )
}
