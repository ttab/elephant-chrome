import { TextBox } from '@/components/ui'
import { Validation } from './Validation'


export const Title = ({ autoFocus, placeholder, onValidation }: {
  autoFocus?: boolean
  placeholder: string
  onValidation?: (label: string, value: string | undefined) => boolean
}): JSX.Element => (

  <div className='flex-grow'>
    <TextBox
      path='root.title'
      placeholder={placeholder}
      className='font-bold text-lg leading-6'
      autoFocus={!!autoFocus}
      singleLine={true}
      />
    {onValidation &&
      <Validation label='Titel' path='root.title' onValidation={onValidation} />
    }
  </div>
)
