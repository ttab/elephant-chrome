import { TextBox } from '@/components/ui'
import { Validation } from './Validation'
import { type FormProps } from './Form/Root'

export const Title = ({ autoFocus, placeholder, path, className, onValidation, validateStateRef, countCharacters }: FormProps & {
  autoFocus?: boolean
  placeholder: string
  path?: string
  className?: string
  countCharacters?: boolean
}): JSX.Element => (
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
    />
  </Validation>
)
