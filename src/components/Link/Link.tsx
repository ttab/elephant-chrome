import { type ForwardedRef, forwardRef } from 'react'
import { type View, type ViewProps } from '@/types'
import { useNavigation, useView } from '@/hooks'
import { v4 as uuid } from 'uuid'

import { handleLink } from './lib/handleLink'
import { toQueryString } from './lib/toQueryString'

interface LinkProps {
  children: React.ReactNode
  to: View
  props?: Omit<ViewProps, 'id'>
  onClick?: (event: unknown) => void
}

export const Link = forwardRef((props: LinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
  const { state, dispatch } = useNavigation()
  const viewId = uuid()
  const viewItem = state.viewRegistry.get(props.to)
  const qs = toQueryString(props.props)

  const { viewId: origin } = useView()

  return (
    <a
      {...props}
      className='p-1'
      href={`${viewItem.meta.path}${qs || ''}`}
      onClick={(event) => {
        event.stopPropagation()
        // Execute forwarded onClick handler
        props.onClick && props.onClick(event)

        // Our onClick handler
        handleLink({
          event,
          dispatch,
          viewItem,
          viewRegistry: state.viewRegistry,
          props: { ...props.props },
          viewId,
          origin
        })
      }}
      ref={ref}>
      {props.children}
    </a>
  )
})

Link.displayName = 'Link'
