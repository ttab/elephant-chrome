import { TextBox } from '@/components/ui'
import { Validation } from './Validation'
import { type FormProps } from './Form/Root'


export const Title = ({ autoFocus, placeholder, path, className, onValidation }: FormProps & {
  autoFocus?: boolean
  placeholder: string
  path?: string
  className?: string
}): JSX.Element => (
  <Validation
    label='Titel'
    path={path || 'root.title'}
    block='title'
    onValidation={onValidation}
  >
    <TextBox
      path={path || 'root.title'}
      placeholder={placeholder}
      className={className}
      autoFocus={!!autoFocus}
      singleLine={true}
    />
  </Validation>)
