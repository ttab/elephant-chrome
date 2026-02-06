import type { ViewMetadata, ViewProps } from '@/types/index'
import { WireViewContent } from './WireViewContent'
import * as Templates from '@/shared/templates'
import { useMemo, type JSX } from 'react'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'

const meta: ViewMetadata = {
  name: 'Wire',
  path: `${import.meta.env.BASE_URL || ''}/wire`,
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

export const Wire = (props: ViewProps & {
  wires?: WireType[]
}): JSX.Element => {
  // The article we're creating
  const [documentId, data] = useMemo(() => {
    const documentId = crypto.randomUUID()
    const ttWireLinks = props.wires?.map((wire) => Block.create({
      type: 'tt/wire',
      uuid: wire.id,
      title: wire.fields['document.title'].values[0],
      rel: 'source-document',
      data: {
        version: wire.fields['current_version'].values[0]
      }
    }))

    const payload = {
      meta: {
        'tt/slugline': [Block.create({ type: 'tt/slugline' })],
        'core/newsvalue': [Block.create({ type: 'core/newsvalue' })]
      },
      links: {
        'tt/wire': ttWireLinks
      }
    }

    return [documentId, toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: Templates.article(documentId, payload)
    })]
  }, [props.wires])

  return (
    <>
      {typeof documentId === 'string' && props.wires
        ? (
            <WireViewContent {...
              {
                ...props,
                wires: props.wires,
                documentId,
                data
              }
            }
            />
          )
        : <></>}
    </>
  )
}

Wire.meta = meta
