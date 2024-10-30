import { TextBox } from '@/components/ui'
import { Validation } from './Validation'
import { cn } from '@ttab/elephant-ui/utils'


export const Title = ({ autoFocus, placeholder, path, className, onValidation }: {
  autoFocus?: boolean
  placeholder: string
  path?: string
  className?: string
  onValidation?: (block: string, label: string, value: string | undefined, reason: string) => boolean
}): JSX.Element => (

  <div className='flex-grow'>
    <TextBox
      path={path || 'root.title'}
      placeholder={placeholder}
      className={cn('font-bold text-lg leading-6', className)}
      autoFocus={!!autoFocus}
      singleLine={true}
      />
    {onValidation &&
      <Validation
        label='Titel'
        path={path || 'root.title'}
        block='title'
        onValidation={onValidation}
      />
    }
  </div>
)
