import {
  type PropsWithChildren
} from 'react'
import type * as Y from 'yjs'

import { CollaborationProviderContext } from '@/contexts'

/**
 * Use as a wrapper around all documents that needs awareness.
 * @deprecated - Use `CollaborationProviderContext` instead.
 */
export const AwarenessDocument = ({ children, documentId, document }: PropsWithChildren & {
  documentId: string
  document?: Y.Doc
  className?: string
}): JSX.Element => {
  return (
    <CollaborationProviderContext documentId={documentId} document={document}>
      {children}
    </CollaborationProviderContext>
  )
}
