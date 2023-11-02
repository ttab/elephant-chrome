import type { MouseEvent } from 'react'
import { NavigationActionType, type View } from '@/types'
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

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (event.ctrlKey || event.metaKey) {
      return
    }

    event.preventDefault()

    dispatch({
      type: NavigationActionType.ADD,
      component: linkItem.component,
      props: {
        ...props,
        name: linkItem.component.name,
        id
      }
    })

    history.pushState({
      id,
      props: { ...props, id },
      itemName: linkItem.metadata.name,
      contentState: [
        ...history.state.contentState,
        {
          id,
          name: linkItem.metadata.name
        }
      ]
    }, children, `${linkItem.metadata.path}?id=${id}`)
  }

  return (
    <a
      className='p-1 hover:font-bold'
      href={`${linkItem.metadata.path}?id=${id}`}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
