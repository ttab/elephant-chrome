import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import { useYObserver } from '@/hooks'
import { type Block } from '@/protos/service'

function findIndex(stateDescriptions: Block[], role: 'internal' | 'public'):
{ createIndex: boolean, index: number } {
  // If no descriptions, assign indices based on role
  if (!stateDescriptions?.length) {
    return {
      createIndex: true,
      index: role === 'internal' ? 1 : 0
    }
  }

  // Else find index
  const foundIndex = stateDescriptions.findIndex((description) => description.role === role)
  return {
    createIndex: foundIndex === -1,
    index: foundIndex === -1 ? stateDescriptions.length : foundIndex
  }
}

export const PlanDescription = ({ role }: {
  role: 'internal' | 'public'
}): JSX.Element => {
  const { state: stateDescriptions = [] } = useYObserver('meta', 'core/description')

  const { createIndex, index } = findIndex(stateDescriptions, role)

  const { set, loading } = useYObserver('meta', `core/description[${index}]`)

  const path = `core/description[${index === -1 ? stateDescriptions.length : index}].data`

  if (createIndex && !loading) {
    set({
      id: '',
      uuid: '',
      uri: '',
      url: '',
      type: 'core/description',
      title: '',
      data: {
        text: ''
      },
      rel: '',
      role,
      name: '',
      value: '',
      contentType: '',
      links: [],
      content: [],
      meta: []
    })
  }

  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        base='meta'
        path={path}
        field='text'
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
