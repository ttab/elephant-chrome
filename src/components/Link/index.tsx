import { NavigationActionType, type ContentState, type View } from '@/types'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

interface LinkProps {
  children: string
  to: View
  props?: Record<string, unknown>
}

export const Link = ({ children, to, props }: LinkProps): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const id = uuid()
  const linkItem = state.registry.get(to)
  return (
    <a
      className='p-1 hover:font-bold'
      href={`${linkItem.metadata.path}?id=${id}`}
      onClick={(event) => {
        event.preventDefault()
        dispatch({
          type: NavigationActionType.ADD,
          component: linkItem.component,
          props: { ...props, id }
        })

        history.pushState({
          id,
          props: { ...props, id },
          itemName: linkItem.metadata.name,
          contentState: [
            ...history.state.contentState.slice(),
            {
              id,
              name: linkItem.metadata.name,
              props
            }
          ] as ContentState[]
        }, children, `${linkItem.metadata.path}?id=${id}`)
      }}
    >
      {children}
    </a>
  )
}
