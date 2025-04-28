import React from 'react'
import { type FormProps } from './Root'
import { cn } from '@ttab/elephant-ui/utils'

export const Footer = ({ children, asDialog, setValidateForm, validateStateRef, className }:
  FormProps & {
    className?: string
  }): JSX.Element | null => {
  if (!asDialog) return null

  return (
    <div className={cn('border-t p-5', className)}>
      {React.Children.map(children, (child: React.ReactNode): React.ReactNode =>
        React.isValidElement<FormProps>(child)
          ? React.cloneElement(child, {
            setValidateForm,
            validateStateRef
          })
          : child
      )}
    </div>
  )
}
