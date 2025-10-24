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
  validateStateRef
}: {
  ydoc: YDocument<Y.Map<unknown>>
  value: Y.XmlText | undefined
  label: string
  autoFocus?: boolean
  placeholder: string
  className?: string
} & FormProps): JSX.Element => {
  const path = useYPath(value, true)

  return (
    <Validation
      ydoc={ydoc}
      label={label}
      path={path}
      block='title'
      onValidation={onValidation}
      validateStateRef={validateStateRef}
    >
      <TextBox
        ydoc={ydoc}
        value={value}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        singleLine={true}
      />
    </Validation>
  )
}
