import {
  useRef,
  useEffect,
  type PropsWithChildren
} from 'react'
import type * as Y from 'yjs'

import { CollaborationProviderContext } from '@/contexts'
import { Awareness } from './'

/**
 * Use as a wrapper around all documents that needs awareness
 */
export const AwarenessDocument = ({ children, documentId, document, className }: PropsWithChildren & {
  documentId: string
  document?: Y.Doc
  className?: string
}): JSX.Element => {
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

  return (
    <CollaborationProviderContext documentId={documentId} document={document}>
      <Awareness name={documentId} ref={setAsOpen} visual={false} className={className}>
        {children}
      </Awareness>
    </CollaborationProviderContext>
  )
}
