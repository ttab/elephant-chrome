import React from 'react'
import { type FormProps } from './Root'
import { cva } from 'class-variance-authority'

export const Content = ({ children, asDialog, onValidation }: FormProps): JSX.Element => {
  const variants = cva('flex flex-col gap-4 items-start',
    {
      variants: {
        asDialog: {
          false: 'px-10',
          true: 'py-5 px-6'
        }
      }
    })

  return (
    <div className={variants({ asDialog })}>
      {React.Children.map(children, (child: React.ReactNode): React.ReactNode =>
        React.isValidElement<FormProps>(child)
          ? React.cloneElement(child, {
            asDialog,
            onValidation
          })
          : child
      )}
    </div>
  )
}
