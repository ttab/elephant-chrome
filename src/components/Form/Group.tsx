import { type JSX } from 'react'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type FormProps } from './Root'
import { cloneChildrenWithProps } from './lib/cloneChildren'
import { cn } from '@ttab/elephant-ui/utils'

export const Group = ({ children, icon: Icon, asDialog, onValidation, validateStateRef, onChange, className }: FormProps & {
  icon?: LucideIcon | null
  className?: string
}): JSX.Element => (

  <div
    className={cn(`flex flex-col space-y-4 w-full
      [&_[role="textbox"]]:justify-center
      [&_[role="textbox"]]:pt-1
      [&_[role="textbox"]]:px-2
      [&_[role="textbox"]]:h-7
      [&_[role="textbox"]]:font-sans
      [&_[role="textbox"]]:text-sm
      [&_[role="textbox"]]:border
      [&_[role="textbox"]:has([data-slate-placeholder="true"])]:ring-0!
      **:data-[slate-placeholder="true"]:opacity-100!
      [&_[data-ele-placeholder="true"][data-ele-validation="true"]]:border-[#5D709F]
      [&_[data-ele-placeholder="true"][data-ele-validation="true"]]:text-[#5D709F]
      [&_[data-ele-validation="true"]_[role="textbox"]:has([data-slate-placeholder="true"])]:text-[#5D709F]
      [&_[data-ele-validation="true"]_[role="textbox"]:has([data-slate-placeholder="true"])]:border-[#5D709F]`,
    className
    )}
  >
    <div className='flex gap-2 w-full items-center'>
      {Icon && <Icon size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}

      {Icon === null && <span className='w-8.5'></span>}

      {cloneChildrenWithProps<FormProps>(children, {
        asDialog,
        onValidation,
        onChange,
        validateStateRef
      })}
    </div>
  </div>
)
