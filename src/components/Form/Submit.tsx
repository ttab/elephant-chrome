import type { ButtonHTMLAttributes } from 'react'
import React, { useState } from 'react'
import { type FormProps } from './Root'
import { toast } from 'sonner'
import { LoaderIcon } from '@ttab/elephant-ui/icons'


export const Submit = ({
  children,
  validateStateRef,
  onValidation,
  setValidateForm,
  onSubmit,
  onSecondarySubmit,
  onTertiarySubmit,
  onDocumentCreated,
  onReset
}: FormProps & {
  documentId?: string
  onDialogClose?: (id: string, title: string) => void
  onSubmit?: () => void
  onSecondarySubmit?: () => void
  onTertiarySubmit?: () => void
  onDocumentCreated?: () => void
  onReset?: () => void
}): JSX.Element | null => {
  const [isSubmitting, setIsSubmitting] = useState<ButtonHTMLAttributes<HTMLButtonElement>['type'] | null>(null)
  const handleValidate = (func: () => void): void => {
    if (validateStateRef && Object.values(validateStateRef.current).every((block) => block.valid)) {
      func()
      return
    }

    if (setValidateForm) {
      setValidateForm(true)
      setIsSubmitting(undefined)
      return
    }

    setIsSubmitting(undefined)
  }

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
    type: ButtonHTMLAttributes<HTMLButtonElement>['type'],
    role: 'primary' | 'secondary' | 'tertiary' | undefined
  ): void => {
    event.preventDefault()
    event.stopPropagation()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(type)

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
          if (onSecondarySubmit && role === 'secondary') {
            handleValidate(() => {
              onSecondarySubmit()
              if (onDocumentCreated) {
                onDocumentCreated()
              }
            })
          }

          if (onTertiarySubmit && role === 'tertiary') {
            handleValidate(() => {
              onTertiarySubmit()
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
      const props: FormProps
        & { onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
          onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
          disabled?: boolean
        } = {}

      const childProps = child.props as {
        type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
        children?: React.ReactNode
        role?: 'primary' | 'secondary' | 'tertiary'
      }

      if (child.props && 'type' in child.props) {
        if (childProps.type === 'button' && !childProps.role) {
          console.error('Button without role, please add a role to the button')
          toast.error('Kunde inte skicka data')
        }

        switch (childProps.type) {
          case 'submit':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'submit', childProps.role)

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'submit', childProps.role)
              }
            }

            props.disabled = !!isSubmitting
            break

          case 'reset':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'reset', childProps.role)

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'reset', childProps.role)
              }
            }


            props.disabled = !!isSubmitting
            break

          case 'button':
            props.onClick = (event: React.MouseEvent<HTMLButtonElement>) =>
              handleClick(event, 'button', childProps.role)

            props.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === 'Enter') {
                handleClick(event, 'button', childProps.role)
              }
            }


            props.disabled = !!isSubmitting
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

      const mappedChildren = childProps?.children
        ? React.Children.map(childProps.children, applyOnClickHandler)
        : childProps?.children

      const shouldShowLoader = Boolean(isSubmitting && childProps?.type === isSubmitting)

      if (shouldShowLoader) {
        props.disabled = true

        return React.cloneElement(
          child,
          props,
          <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin' />
        )
      }

      return React.cloneElement(child, props, mappedChildren)
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
