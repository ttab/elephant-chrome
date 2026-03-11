import type { ViewMetadata, ViewProps } from '@/types/index'
import { View, ViewHeader } from '@/components/View'
import { useMemo, useState, type JSX } from 'react'
import type * as Y from 'yjs'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { fields as wireFields, type Wire as WireDoc, type WireFields } from '@/shared/schemas/wire'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { useQuery } from '@/hooks'
import { Error } from '@/views/Error'
import { CableIcon } from '@ttab/elephant-ui/icons'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { WirePreview } from '@/components/WirePreview'
import { SourceEntry } from './SourceEntry'

const meta: ViewMetadata = {
  name: 'Sources',
  path: `${import.meta.env.BASE_URL || ''}/sources`,
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

export const Sources = ({ id }: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const documentId = id || query.id

  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  return <SourcesContent documentId={documentId} />
}

const SourcesContent = ({ documentId }: { documentId: string }): JSX.Element => {
  const ydoc = useYDocument<Y.Map<unknown>>(documentId)
  const [wireBlocks] = useYValue<Block[]>(ydoc.ele, 'links.tt/wire')
  const [selectedWireId, setSelectedWireId] = useState<string | undefined>(undefined)

  const wireUuids = useMemo(
    () => (wireBlocks ?? []).map((b) => b.uuid).filter(Boolean),
    [wireBlocks]
  )

  const wiresQuery = useMemo(() => wireUuids.length > 0
    ? QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({ field: '_id', values: wireUuids })
            }
          }]
        })
      }
    })
    : undefined, [wireUuids])

  const { data } = useDocuments<WireDoc, WireFields>({
    documentType: 'tt/wire',
    query: wiresQuery,
    fields: wireFields,
    size: wireUuids.length || 1,
    disabled: wireUuids.length === 0
  })

  const wireMap = useMemo(() => {
    const map = new Map<string, WireDoc>()
    for (const wire of data ?? []) {
      map.set(wire.id, wire)
    }
    return map
  }, [data])

  const selectedWire = selectedWireId ? wireMap.get(selectedWireId) : undefined

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title
          name='Sources'
          title='Källor'
          icon={CableIcon}
          iconColor='#FF6347'
        />
        <ViewHeader.Content />
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content variant='no-scroll'>
        {!wireBlocks || wireBlocks.length === 0
          ? (
              <p className='px-4 py-6 text-sm text-muted-foreground'>
                Inga källtelegram
              </p>
            )
          : (
              <div className='flex flex-col h-full'>
                <div className='border-b'>
                  {wireBlocks.map((block) => (
                    <SourceEntry
                      key={block.uuid}
                      block={block}
                      isSelected={selectedWireId === block.uuid}
                      onSelect={setSelectedWireId}
                    />
                  ))}
                </div>

                <div className='flex-1 overflow-y-auto'>
                  {selectedWireId && !selectedWire
                    ? (
                        <p className='px-4 py-6 text-sm text-muted-foreground text-center'>
                          Laddar telegram…
                        </p>
                      )
                    : selectedWire
                      ? <WirePreview wire={selectedWire} />
                      : null}
                </div>
              </div>
            )}
      </View.Content>
    </View.Root>
  )
}

Sources.meta = meta
