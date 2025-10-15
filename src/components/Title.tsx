import type { FormProps } from './Form/Root'
import { TextBox } from './ui'
import { Validation } from './Validation'
import { useYPath, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Title = ({
  ydoc,
  rootMap,
  value,
  autoFocus,
  placeholder,
  className,
  onValidation,
  validateStateRef
}: {
  ydoc: YDocument<Y.Map<unknown>>
  rootMap?: Y.Map<unknown>
  value?: Y.XmlText
  autoFocus?: boolean
  placeholder: string
  className?: string
} & FormProps): JSX.Element => {
  const path = useYPath(value, true)

  if (!value) {
    return <></>
  }

  return (
    <Validation
      ydoc={ydoc}
      rootMap={rootMap}
      label='Titel'
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

Title.displayName = 'Title'
