import { type JSX } from 'react'
import type { FormProps } from '../Form/Root'
import { TextBox } from './'
import { Validation } from '../Validation'
import { useYPath, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const TextInput = ({
  ydoc,
  value,
  label,
  autoFocus,
  placeholder,
  className,
  onValidation,
  rootMap,
  validateStateRef,
  disabled,
  icon,
  iconAction
}: {
  ydoc: YDocument<Y.Map<unknown>>
  value: Y.XmlText | undefined
  rootMap?: Y.Map<unknown>
  label: string
  autoFocus?: boolean
  placeholder: string
  className?: string
  disabled?: boolean
  icon?: JSX.Element
  iconAction?: () => void
} & FormProps): JSX.Element => {
  const path = useYPath(value, true)
  return (
    <Validation
      ydoc={ydoc}
      rootMap={rootMap}
      label={label}
      path={path}
      block='title'
      onValidation={onValidation}
      validateStateRef={validateStateRef}
    >
      <TextBox
        icon={icon}
        iconAction={iconAction}
        ydoc={ydoc}
        value={value}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        singleLine={true}
        disabled={disabled}
      />
    </Validation>
  )
}
