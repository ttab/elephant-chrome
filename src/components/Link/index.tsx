import { type View, type ViewProps } from '@/types'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

import { handleLink } from './link'

interface LinkProps {
  children: React.ReactNode
  to: View
  props?: ViewProps
}

export const Link = ({ children, to, props }: LinkProps): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const id = uuid()
  const linkItem = state.registry.get(to)

  return (
    <a
      className='p-1 hover:font-bold'
      href={`${linkItem.metadata.path}?id=${id}`}
      onClick={(event) => handleLink({ event, dispatch, linkItem, props, id })}
    >
      {children}
    </a>
  )
}
