import React from 'react'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { type FormProps } from './Root'

export const Title = ({ children, asDialog, onValidation }: FormProps): JSX.Element => {
  const titleVariants = cva(`
    w-full
    [&_[role="textbox"]:has([data-slate-placeholder="true"])]:!ring-0
    [&_[role="textbox"]:has([data-slate-placeholder="true"])]:border
    [&_[role="textbox"]:has([data-slate-placeholder="true"])]:border-[#5D709F]
    [&_[role="textbox"]:not(:has([data-slate-placeholder="true"]))]:ring-indigo-200
`, {
    variants: {
      asDialog: {
        false: `pt-8
          -ml-1
          [&_[role="textbox"]]:!text-lg
          [&_[role="textbox"]]:font-bold
          [&_[role="textbox"]]:leading-6`,
        true: 'pt-2 [&_[role="textbox"]]:text-medium'

      }
    }
  })

  return (
    <div className={cn(titleVariants({ asDialog }))}>
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
