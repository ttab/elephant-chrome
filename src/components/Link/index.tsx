import { NavigationActionType, type ContentState } from '@/types'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

interface LinkProps {
  label: string
  component: React.FC
  props?: Record<string, unknown>
}

export const Link = ({ label, component, props }: LinkProps): JSX.Element => {
  const { dispatch } = useNavigation()
  return (
    <a
      className='p-1 hover:font-bold'
      onClick={(event) => {
        event.preventDefault()
        const id = uuid()
        const args = { ...props, id }
        dispatch({
          type: NavigationActionType.ADD,
          component,
          name: component.displayName,
          props: args,
          id
        })

        history.pushState({
          id,
          props: { ...props, id },
          itemName: component.displayName,
          contentState: [
            ...history.state.contentState,
            { id, name: component.displayName, props: args }
          ] as ContentState[]
        }, label, `${label.toLowerCase()}?id=${id}`)
      }}
    >
      {label}
    </a>
  )
}
