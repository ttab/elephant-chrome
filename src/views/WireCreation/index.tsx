import type { ViewMetadata, ViewProps } from '@/types/index'
import { WireViewContent } from './WireViewContent'
import * as Templates from '@/shared/templates'
import { useMemo, type JSX } from 'react'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { useDocumentDefaults } from '@/hooks'
import { useSession } from 'next-auth/react'
import { getContentSourceLink } from '@/shared/getContentSourceLink'

const meta: ViewMetadata = {
  name: 'WireCreation',
  path: `${import.meta.env.BASE_URL || ''}/wire-creation`,
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

export const WireCreation = (props: ViewProps & {
  wires?: WireType[]
}): JSX.Element => {
  const defaults = useDocumentDefaults()
  const { data: session } = useSession()

  // Two UUIDs:
  //  - formId backs the dialog's form Y.Doc (Yjs-bound title/slugline/awareness).
  //    Throwaway: never referenced again after the dialog closes.
  //  - articleId is the actual article. Generated here and only ever sent to
  //    the repository via createArticle's direct saveDocument call. It is
  //    intentionally NOT opened in Hocuspocus during the dialog, so its cache
  //    starts clean when the Editor opens it later.
  const [formId, articleId, data] = useMemo(() => {
    const formId = crypto.randomUUID()
    const articleId = crypto.randomUUID()
    const ttWireLinks = props.wires?.map((wire) => Block.create({
      type: 'tt/wire',
      uuid: wire.id,
      title: wire.fields['document.title'].values[0],
      rel: 'source-document',
      data: {
        version: wire.fields['current_version'].values[0]
      }
    }))

    const contentSource = getContentSourceLink({ org: session?.org, units: session?.units })

    const payload = {
      ...defaults,
      meta: {
        'tt/slugline': [Block.create({ type: 'tt/slugline' })],
        'core/newsvalue': [Block.create({ type: 'core/newsvalue' })]
      },
      links: {
        'tt/wire': ttWireLinks,
        ...(contentSource ? { 'core/content-source': [contentSource] } : {})
      }
    }

    return [formId, articleId, toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      subset: [],
      document: Templates.article(articleId, payload)
    })]
  }, [props.wires, defaults, session?.units, session?.org])

  return (
    <>
      {typeof formId === 'string' && typeof articleId === 'string' && props.wires
        ? (
            <WireViewContent {...
              {
                ...props,
                wires: props.wires,
                documentId: formId,
                articleId,
                data
              }
            }
            />
          )
        : <></>}
    </>
  )
}

WireCreation.meta = meta
