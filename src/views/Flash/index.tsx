import type * as Y from 'yjs'
import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { useQuery } from '@/hooks'
import { FlashViewContent } from './FlashViewContent'

const meta: ViewMetadata = {
  name: 'Flash',
  path: `${import.meta.env.BASE_URL || ''}/flash`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Flash = (props: ViewProps & {
  document?: Y.Doc
}): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <FlashViewContent {...props} documentId={documentId} />
            </AwarenessDocument>
          )
        : <></>}
    </>
  )
}

Flash.meta = meta
