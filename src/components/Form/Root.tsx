import React, { type Dispatch, type SetStateAction, useRef, useState, type PropsWithChildren, useCallback, useMemo } from 'react'
import { ValidationAlert } from '../ValidationAlert'
import { type ValidateState } from '@/types/index'
import { cn } from '@ttab/elephant-ui/utils'


export interface OnValidation {
  block: string
  label: string
  value?: string
  compareValues?: string[]
  reason: string
}

export interface FormProps extends PropsWithChildren {
  asDialog?: boolean
  onValidation?: (args: OnValidation) => boolean
  setValidateForm?: Dispatch<SetStateAction<boolean>>
  validateStateRef?: React.MutableRefObject<ValidateState>
  onChange?: (arg: boolean) => void
  children?: React.ReactNode
}

export const Root = ({ children, asDialog = false, onChange, className }: PropsWithChildren & {
  asDialog?: boolean
  onChange?: (arg: boolean) => void
  className?: string
}): JSX.Element => {
  const validateStateRef = useRef<ValidateState>({})
  const [validateForm, setValidateForm] = useState<boolean>(!asDialog)

  const formRootStyle = `
    w-full
    flex
    flex-col
    space-y-4
    [&_[role="textbox"]:focus]:ring-indigo-200
    [&_[role="textbox"]:has([data-slate-placeholder="true"])]:ring-1
    [&_[role="textbox"]:focus]:bg-violet-50
    dark:[&_[role="textbox"]:focus]:bg-[#36363a]
    [&_[role="textbox"]]:placeholder-gray-500
    [&_[role="textbox"]]:text-base
    [&_[role="textbox"]]:text-sm
    [&_[role="textbox"]]:leading-tight
    [&_[role="textbox"]]:tracking-right`

  const handleValidation = useCallback(
    ({ block, label, value, compareValues, reason }: OnValidation): boolean => {
      const isValid = [!!value, isUnique(value, compareValues)].every(Boolean)

      validateStateRef.current = {
        ...validateStateRef.current,
        [block]: { label, valid: isValid, reason }
      }

      if (validateForm) {
        return !!isValid
      }

      return true
    },
    [validateForm]
  )


  const props = useMemo(
    () => ({
      asDialog,
      onValidation: handleValidation,
      setValidateForm,
      onChange,
      validateStateRef
    }),
    [asDialog, handleValidation, onChange, validateStateRef]
  )

  return (
    <>
      <ValidationAlert validateStateRef={validateStateRef} />
      <div className={cn(formRootStyle, className)}>
        {React.Children.map(children, (child: React.ReactNode): React.ReactNode =>
          React.isValidElement<FormProps>(child)
            ? React.cloneElement(child, props)
            : child
        )}
      </div>
    </>
  )
}

function isUnique(value?: string, compareValues?: string[]) {
  if (compareValues?.length) {
    return compareValues.filter((v) => v === value).length <= 1
  }

  // if no compareValues are provided, we assume the value is unique and valid
  return true
}
