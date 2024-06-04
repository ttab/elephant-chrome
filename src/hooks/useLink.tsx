import type { KeyboardEvent, MouseEvent } from 'react'
import { useNavigation, useView } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import type { View } from '../types'

export const useLink = (viewName: View) => {
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  return (
    event: MouseEvent<Element, MouseEvent> | KeyboardEvent<Element>,
    props: Record<string, unknown>,
    callbacks?: Record<string, () => void>
  ): void => {
    handleLink({
      event,
      dispatch,
      viewItem: state.viewRegistry.get(viewName),
      viewRegistry: state.viewRegistry,
      props: { ...props },
      viewId: crypto.randomUUID(),
      origin,
      onDocumentCreated: callbacks?.onDocumentCreated
    })
  }
}
