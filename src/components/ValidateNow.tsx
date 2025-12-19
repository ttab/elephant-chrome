import { useEffect, type PropsWithChildren } from 'react'
import type { FormProps } from './Form/Root'

export const ValidateNow = ({ setValidateForm }: FormProps & PropsWithChildren): null => {
  useEffect(() => {
    if (setValidateForm) {
      setValidateForm(true)
    }
  }, [setValidateForm])

  return null
}
