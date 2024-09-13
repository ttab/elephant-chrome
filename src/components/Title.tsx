import { TextBox } from '@/components/ui'


export const Title = ({ autoFocus, placeholder }: {
  autoFocus?: boolean
  placeholder: string
}): JSX.Element => (
  <TextBox
    path='root.title'
    placeholder={placeholder}
    className='font-bold text-lg leading-6'
    autoFocus={!!autoFocus}
    singleLine={true}
  />
)
