import React from 'react'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type FormProps } from './Root'

export const Group = ({ children, icon: Icon, asDialog, onValidation }: FormProps & {
  icon?: LucideIcon
}): JSX.Element => (

  <div className='flex flex-col space-y-4 w-full
      [&_[role="textbox"]]:justify-center
      [&_[role="textbox"]]:pt-1
      [&_[role="textbox"]]:px-2
      [&_[role="textbox"]]:h-7
      [&_[role="textbox"]]:font-sans
      [&_[role="textbox"]]:text-sm
      [&_[role="textbox"]]:border
      [&_[role="textbox"]:has([data-slate-placeholder="true"])]:!ring-0
      [&_[data-slate-placeholder="true"]]:!opacity-100
      [&_[data-ele-placeholder="true"][data-ele-validation="true"]]:border-[#5D709F]
      [&_[data-ele-placeholder="true"][data-ele-validation="true"]]:text-[#5D709F]
      [&_[data-ele-validation="true"]_[role="textbox"]:has([data-slate-placeholder="true"])]:text-[#5D709F]
      [&_[data-ele-validation="true"]_[role="textbox"]:has([data-slate-placeholder="true"])]:border-[#5D709F]'
  >
    <div className='flex gap-2 w-full items-center'>
      {Icon
      && <Icon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
      {React.Children.map(children, (child: React.ReactNode): React.ReactNode =>
        React.isValidElement<FormProps>(child)
          ? React.cloneElement(child, {
            asDialog,
            onValidation
          })
          : child
      )}
    </div>
  </div>
)
