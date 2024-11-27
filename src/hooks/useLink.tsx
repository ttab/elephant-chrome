import type { MouseEvent } from 'react'
import { useHistory, useNavigation, useView } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { type ViewProps, type View } from '../types'

export const useLink = (viewName: View) => {
  const history = useHistory()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return (
    event: MouseEvent<Element> | KeyboardEvent | undefined,
    props: ViewProps,
    target?: 'self' | 'blank' | 'last',
    callbacks?: Record<string, () => void>
  ): void => {
    handleLink({
      event,
      dispatch,
      viewItem: state.viewRegistry.get(viewName),
      props: { ...props },
      viewId: crypto.randomUUID(),
      origin,
      target,
      onDocumentCreated: callbacks?.onDocumentCreated,
      history
    })
  }
}
