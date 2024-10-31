import React, { type Dispatch, type SetStateAction, useRef, useState, type PropsWithChildren } from 'react'
import { ValidationAlert } from '../ValidationAlert'
import { type ValidateState } from '@/types/index'
import { cn } from '@ttab/elephant-ui/utils'

export interface FormProps extends PropsWithChildren {
  asDialog?: boolean
  onValidation?: (block: string, label: string, value: string | undefined, reason: string) => boolean
  setValidateForm?: Dispatch<SetStateAction<boolean>>
  validateStateRef?: React.MutableRefObject<ValidateState>
  children?: React.ReactNode
}

export const Root = ({ children, asDialog = false, className }: PropsWithChildren & {
  asDialog?: boolean
  className?: string
}): JSX.Element => {
  const validateStateRef = useRef<ValidateState>({})
  const [validateForm, setValidateForm] = useState<boolean>(!asDialog)
  const formRootStyle = `
    w-full
    space-y-4
    [&_[role="textbox"]:focus]:ring-indigo-200
    [&_[role="textbox"]:has([data-slate-placeholder="true"])]:ring-1
    [&_[role="textbox"]:focus]:bg-violet-50
    [&_[role="textbox"]]:placeholder-gray-500
    [&_[role="textbox"]]:text-base
    [&_[role="textbox"]]:leading-tight
    [&_[role="textbox"]]:tracking-right`

  const handleValidation = (block: string, label: string, value: string | undefined, reason: string): boolean => {
    validateStateRef.current = {
      ...validateStateRef.current,
      [block]: { label, valid: !!value, reason }
    }

    if (validateForm) {
      return !!value
    }

    return true
  }

  return (

    <section>
      <ValidationAlert validateStateRef={validateStateRef} />
      <div className={cn(formRootStyle, className)}>
        {React.Children.map(children, (child: React.ReactNode): React.ReactNode =>
          React.isValidElement<FormProps>(child)
            ? React.cloneElement(child, {
              asDialog,
              onValidation: handleValidation,
              setValidateForm,
              validateStateRef
            })
            : child
        )}
      </div>
    </section>
  )
}
