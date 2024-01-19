import {
  useRef,
  useEffect,
  type PropsWithChildren
} from 'react'

import { CollaborationProviderContext } from '@/contexts'
import { Awareness } from './'
// import { useAwareness } from '@/hooks'

/**
 * Use as a wrapper around all documents that needs awareness
 */
export const AwarenessDocument = ({ children, documentId }: PropsWithChildren & { documentId: string }): JSX.Element => {
  const setAsOpen = useRef<(value: boolean) => void>(null)

  // TODO: Create RemoteUserContextProvider
  // TODO: Signal to RemoteUserContextProvider which remote users have the document open
  // TODO: Use RemoteUserContextProvider in AppHeader to render Avatars for all remote users - only when this view is focused!
  // const [focused] = useAwareness(documentId)
  // useEffect(() => {
  //   console.log(focused)
  // }, [focused])


  useEffect(() => {
    const { current } = setAsOpen
    if (current) {
      current(true)
    }

    return () => {
      if (current) {
        current(false)
      }
    }
  }, [setAsOpen])

  return <CollaborationProviderContext documentId={documentId}>
    <Awareness name={documentId} ref={setAsOpen} visual={false}>
      {children}
    </Awareness>
  </CollaborationProviderContext>
}
