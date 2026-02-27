import type { ViewMetadata, ViewProps } from '@/types/index'
import { View, ViewHeader } from '@/components/View'
import { useMemo, type JSX } from 'react'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { fields as wireFields, type Wire as WireDoc, type WireFields } from '@/shared/schemas/wire'
import { useDocuments } from '@/hooks/index/useDocuments'
import { WirePreview } from '@/components/WirePreview/WirePreview'
import { CableIcon } from '@ttab/elephant-ui/icons'

const meta: ViewMetadata = {
  name: 'Wire',
  path: `${import.meta.env.BASE_URL || ''}/wire`,
  widths: {
    sm: 12,
    md: 6,
    lg: 6,
    xl: 6,
    '2xl': 5,
    hd: 4,
    fhd: 3,
    qhd: 2,
    uhd: 2
  }
}

export const Wire = ({ id }: ViewProps): JSX.Element => {
  const query = useMemo(() => id
    ? QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({ field: '_id', values: [id] })
            }
          }]
        })
      }
    })
    : undefined, [id])

  const { data } = useDocuments<WireDoc, WireFields>({
    documentType: 'tt/wire',
    query,
    fields: wireFields,
    size: 1,
    disabled: !id
  })

  const wire = data?.[0]

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='Wire'
          title='Telegram'
          icon={CableIcon}
          iconColor='#FF6347'
        />
        <ViewHeader.Content />
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content className='pt-6'>
        {wire && <WirePreview wire={wire} />}
      </View.Content>
    </View.Root>
  )
}

Wire.meta = meta
