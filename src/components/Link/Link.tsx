import { type ForwardedRef, type MouseEvent, forwardRef } from 'react'
import { type View, type ViewProps } from '@/types'
import { useHistory, useNavigation, useView } from '@/hooks'

import { handleLink } from './lib/handleLink'
import { toQueryString } from './lib/toQueryString'

interface LinkProps {
  children: React.ReactNode
  to: View
  props?: ViewProps
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  target?: 'self' | 'last'
  className?: string
}

export const Link = forwardRef((props: LinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const viewId = crypto.randomUUID()
  const viewItem = state.viewRegistry.get(props.to)
  const qs = toQueryString(props.props)

  const { viewId: origin } = useView()

  return (
    <a
      className={props?.className || ''}
      {...props}
      href={`${viewItem.meta.path}${qs || ''}`}
      onClick={(event) => {
        event.stopPropagation()
        // Execute forwarded onClick handler
        if (props.onClick) {
          props.onClick(event)
        }

        // Our onClick handler
        handleLink({
          event,
          dispatch,
          viewItem,
          props: { ...props.props },
          viewId,
          origin,
          target: props.target,
          history
        })
      }}
      ref={ref}
    >
      {props.children}
    </a>
  )
})

Link.displayName = 'Link'
