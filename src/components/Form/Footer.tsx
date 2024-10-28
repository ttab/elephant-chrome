import React from 'react'
import { type FormProps } from './Root'

export const Footer = ({ children, asDialog, setValidateForm, validateStateRef }: FormProps): JSX.Element | null => {
  if (!asDialog) return null

  return (
    <div className='border-t p-5'>
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
