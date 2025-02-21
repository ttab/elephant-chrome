import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { WireViewContent } from './WireViewContent'
import * as Templates from '@/defaults/templates'
import { createDocument } from '@/lib/createYItem'
import { useMemo } from 'react'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Wire as WireType } from '@/hooks/index/lib/wires'

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
  wire?: WireType
}): JSX.Element => {
  // The article we're creating
  const initialArticle = useMemo(() => {
    return createDocument({
      template: Templates.article,
      inProgress: true,
      payload: {
        meta: {
          'tt/slugline': [Block.create({ type: 'tt/slugline' })],
          'core/newsvalue': [Block.create({ type: 'core/newsvalue' })]
        },
        links: {
          'tt/wire': [Block.create({
            type: 'tt/wire',
            uuid: props.wire?.id,
            title: props.wire?.fields['document.title'].values[0],
            rel: 'source-document',
            data: {
              version: props.wire?.fields['current_version'].values[0]
            }
          })]
        }
      }
    })
  }, [props.wire])

  return (
    <>
      {typeof initialArticle[0] === 'string' && props.wire
        ? (
            <AwarenessDocument documentId={initialArticle[0]} document={initialArticle[1]}>
              <WireViewContent {...
                {
                  ...props,
                  wire: props.wire,
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

Wire.meta = meta
