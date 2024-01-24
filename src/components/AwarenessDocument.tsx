import {
  useRef,
  useEffect,
  type PropsWithChildren
} from 'react'

import { CollaborationProviderContext } from '@/contexts'
import { Awareness } from './'

/**
 * Use as a wrapper around all documents that needs awareness
 */
export const AwarenessDocument = ({ children, documentId }: PropsWithChildren & { documentId: string }): JSX.Element => {
  const setAsOpen = useRef<(value: boolean) => void>(null)

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
