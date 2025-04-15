import type { ButtonHTMLAttributes } from 'react'
import React from 'react'
import { type FormProps } from './Root'


export const Submit = ({
  children,
  validateStateRef,
  onValidation,
  setValidateForm,
  onSubmit,
  onSecondarySubmit,
  onDocumentCreated,
  onReset
}: FormProps & {
  documentId?: string
  onDialogClose?: (id: string, title: string) => void
  onSubmit?: () => void
  onSecondarySubmit?: () => void
  onDocumentCreated?: () => void
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

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
    type: ButtonHTMLAttributes<HTMLButtonElement>['type']
  ): void => {
    event.preventDefault()
    event.stopPropagation()

    if (handleValidate) {
      switch (type) {
        case 'submit':
          if (onSubmit) {
            handleValidate(() => {
              onSubmit()
              if (onDocumentCreated) {
                onDocumentCreated()
              }
            })
          }
          break

        case 'button':
          if (onSecondarySubmit) {
            handleValidate(() => {
              onSecondarySubmit()
              if (onDocumentCreated) {
                onDocumentCreated()
              }
            })
          }
          break

        case 'reset':
          if (onReset) {
            onReset()
          }
          break

        default:
          break
      }
    }
  }

  const applyOnClickHandler = (child: React.ReactNode): React.ReactNode => {
    if (React.isValidElement(child)) {
      const props: FormProps &
        { onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
          onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
        } = {}

      const childProps = child.props as { type: string, children: React.ReactElement }

      if (child.props && 'type' in child.props) {
        switch (childProps.type) {
          case 'submit':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'submit')

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'submit')
              }
            }
            break

          case 'reset':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'reset')

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'reset')
              }
            }
            break

          case 'button':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'button')

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'button')
              }
            }
            break
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
      if (childProps?.children) {
        props.children = React.Children.map(childProps.children, applyOnClickHandler)
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
