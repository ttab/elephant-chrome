import { type ForwardedRef, forwardRef } from 'react'
import { type View, type ViewProps } from '@/types'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

import { handleLink } from './link'

interface LinkProps {
  children: React.ReactNode
  to: View
  props?: ViewProps
  onClick?: (event: unknown) => void
}

export const Link = forwardRef((props: LinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
  const { state, dispatch } = useNavigation()
  const id = uuid()
  const linkItem = state.registry.get(props.to)

  return (
    <a
      {...props}
      className='p-1 hover:font-bold'
      href={`${linkItem.metadata.path}?id=${id}`}
      onClick={(event) => {
        // Execute forwarded onClick handler
        props.onClick && props.onClick(event)

        // Our onClick handler
        handleLink({ event, dispatch, linkItem, props: props.props, id })
      }}
      ref={ref}>
        {props.children}
    </a>
  )
})
