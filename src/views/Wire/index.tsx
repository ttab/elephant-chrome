import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { WireViewContent } from './WireViewContent'
import type { DialogViewCreate } from '@/components/DialogView'

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

export const Wire = (props: ViewProps & DialogViewCreate): JSX.Element => {
  return (
    <>
      {typeof props.planningId === 'string'
        ? (
            <AwarenessDocument documentId={props.planningId} document={props.planningDocument}>
              <WireViewContent {...props} documentId={props.id} />
            </AwarenessDocument>
          )
        : <></>}
    </>
  )
}

Wire.meta = meta
