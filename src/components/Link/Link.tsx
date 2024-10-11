import { type ForwardedRef, forwardRef, type MouseEvent } from 'react'
import { type View, type ViewProps } from '@/types'
import { useNavigation, useView } from '@/hooks'

import { handleLink } from './lib/handleLink'
import { toQueryString } from './lib/toQueryString'

interface LinkProps {
  children: React.ReactNode
  to: View
  props?: ViewProps
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  className?: string
}

export const Link = forwardRef((props: LinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
  const { state, dispatch } = useNavigation()
  const viewId = crypto.randomUUID()
  const viewItem = state.viewRegistry.get(props.to)
  const qs = toQueryString(props.props)

  const { viewId: origin } = useView()

  return (
    <a
      className={props?.className || ''}
      {...props}
      href={`${viewItem.meta.path}${qs || ''}`}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
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
