import React from 'react'
import { type FormProps } from './Root'


export const Submit = ({
  children,
  validateStateRef,
  onValidation,
  setValidateForm,
  onSubmit,
  onReset
}: FormProps & {
  documentId?: string
  onDialogClose?: (id: string, title: string) => void
  onSubmit?: () => void
  onReset?: () => void
}): JSX.Element | null => {
  const handleValidate = (func: () => void): void => {
    if (validateStateRef && Object.values(validateStateRef.current).every((block) => block.valid)) {
      func()
    }

    if (setValidateForm) {
      setValidateForm(true)
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, type: 'submit' | 'reset'): void => {
    event.preventDefault()
    event.stopPropagation()

    if (handleValidate) {
      if (type === 'submit' && onSubmit) {
        handleValidate(onSubmit)
      } else if (type === 'reset' && onReset) {
        onReset()
      }
    }
  }

  const applyOnClickHandler = (child: React.ReactNode): React.ReactNode => {
    if (React.isValidElement(child)) {
      const props: FormProps &
        { onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void } = {}

      if (child.props && 'type' in child.props) {
        if (child.props.type === 'submit') {
          props.onClick = (event: React.MouseEvent<HTMLButtonElement>) => handleClick(event, 'submit')
        } else if (child.props.type === 'reset') {
          props.onClick = (event: React.MouseEvent<HTMLButtonElement>) => handleClick(event, 'reset')
        }
      }

      if (typeof child.type !== 'string' && child.type && 'type' in child.props) {
        const componentType = child.type as React.ComponentType<unknown>
        const displayName = (componentType).displayName

        if (displayName?.includes('Form.')) {
          props.onValidation = onValidation
          props.setValidateForm = setValidateForm
        }
      }

      // Recursively apply to children
      if (child.props?.children) {
        props.children = React.Children.map(child.props.children as React.ReactElement, applyOnClickHandler)
      }

      return React.cloneElement(child, props)
    }
    return child
  }

  if (children) {
    return (
      <div>
        {React.Children.map(children, applyOnClickHandler)}
      </div>
    )
  }

  return null
}
