import React from 'react'
import type { FormProps } from './Form/Root'
import { TextBox } from './ui'
import { Validation } from './Validation'

export const Title = React.memo(({
  autoFocus,
  placeholder,
  path,
  className,
  onValidation,
  validateStateRef,
  countCharacters,
  onChange
}: {
  autoFocus?: boolean
  placeholder: string
  path?: string
  className?: string
  countCharacters?: boolean
} & FormProps): JSX.Element => (
  <Validation
    label='Titel'
    path={path || 'root.title'}
    block='title'
    onValidation={onValidation}
    validateStateRef={validateStateRef}
  >
    <TextBox
      path={path || 'root.title'}
      placeholder={placeholder}
      className={className}
      autoFocus={!!autoFocus}
      singleLine={true}
      countCharacters={countCharacters}
      onChange={onChange}
    />
  </Validation>
)
)

Title.displayName = 'Title'
