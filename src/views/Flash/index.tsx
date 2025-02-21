import type * as Y from 'yjs'
import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { FlashViewContent } from './FlashViewContent'
import { createDocument } from '@/lib/createYItem'
import { useMemo } from 'react'
import * as Templates from '@/defaults/templates'

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
  const initialArticle = useMemo(() => {
    return createDocument({
      template: Templates.flash,
      inProgress: true
    })
  }, [])

  return (
    <>
      {typeof initialArticle[0] === 'string'
        ? (
            <AwarenessDocument documentId={initialArticle[0]} document={initialArticle[1]}>
              <FlashViewContent {...
                {
                  ...props,
                  id: initialArticle[0]
                }
              }
              />
            </AwarenessDocument>
          )
        : <></>}
    </>
  )
}

Flash.meta = meta
