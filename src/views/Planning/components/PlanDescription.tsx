import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'

export const PlanDescription = ({ role, name }: {
  role: string
  name: string
}): JSX.Element | undefined => {
  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        name={name}
        icon={role === 'internal' && <MessageCircleMore
          size={28}
          strokeWidth={1.75}
          className='px-1 text-muted-foreground'
        />}
        placeholder={role === 'public' ? 'Public description' : 'Internal message'}
      />
    </div>
  )
}
