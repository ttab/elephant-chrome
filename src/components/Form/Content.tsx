import React, { type JSX } from 'react'
import { type FormProps } from './Root'
import { cva } from 'class-variance-authority'
import { cloneChildrenWithProps } from './lib/cloneChildren'

export const Content = React.memo(
  ({ children, asDialog, onValidation, validateStateRef }: FormProps): JSX.Element => {
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
        {cloneChildrenWithProps<FormProps>(children, {
          asDialog,
          onValidation,
          validateStateRef
        })}
      </div>
    )
  }
)

Content.displayName = 'Content'
