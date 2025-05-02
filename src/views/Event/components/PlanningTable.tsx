import { useLink } from '@/hooks/useLink'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { GanttChartSquare, PlusIcon } from '@ttab/elephant-ui/icons'
import { useRef, useState } from 'react'
import { NewItems } from '@/components/Table/NewItems'
import type { FormProps } from '@/components/Form/Root'
import { Button } from '@ttab/elephant-ui'
import { createDocument } from '@/lib/createYItem'
import { Planning } from '@/views/Planning'
import { useModal } from '@/components/Modal/useModal'
import * as Templates from '@/defaults/templates'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useDocuments } from '@/hooks/index/useDocuments'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import type { Planning as PlanningType } from '@/hooks/index/useDocuments/schemas/planning'

export type NewItem = { title: string, uuid: string } | undefined
type PlanningTableFields = ['document.title', 'document.rel.event.uuid']

export const PlanningTable = ({ provider, documentId, asDialog }: {
  documentId: string
  provider?: HocuspocusProvider
} & FormProps): JSX.Element => {
  const openPlanning = useLink('Planning')
  const createdDocumentIdRef = useRef<string | undefined>()
  const { showModal, hideModal } = useModal()
  const [newItem, setNewItem] = useState<NewItem>()

  const { data, mutate, error } = useDocuments<PlanningType, PlanningTableFields>({
    documentType: 'core/planning-item',
    fields: ['document.title', 'document.rel.event.uuid'],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'document.rel.event.uuid',
                values: [documentId]
              })
            }
          }
          ]
        })
      }
    })
  })

  useRepositoryEvents('core/planning-item', (event) => {
    if (createdDocumentIdRef.current === event.uuid && event.type === 'core/planning-item' && event.event === 'document') {
      void (async () => {
        try {
          if (Array.isArray(data) && newItem?.title) {
            await mutate([...data, {
              source: {},
              score: 1,
              sort: [''],
              fields: {
                'document.title': {
                  values: [newItem?.title]
                },
                'document.rel.event.uuid': {
                  values: [documentId]
                }
              },
              id: newItem?.uuid
            } as PlanningType], { revalidate: false })
          }
        } catch (error) {
          console.warn('Failed to update planning table', error)
        }
      })()
    }
  })

  if (!data) {
    return <>Loading...</>
  }

  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <div className='pl-6'>
      <div className='flex flex-start pt-2 text-primary pb-4'>
        <Button
          variant='ghost'
          className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
          onClick={() => {
            const payload = provider?.document
              ? createPayload(provider.document)
              : undefined

            const initialDocument = createDocument({
              template: Templates.planning,
              inProgress: true,
              createdDocumentIdRef,
              payload: {
                ...payload || {},
                links: {
                  ...payload?.links,
                  'core/event': [Block.create({
                    type: 'core/event',
                    uuid: documentId,
                    title: payload?.title || 'Titel saknas',
                    rel: 'event'
                  })]
                }
              }
            })

            showModal(
              <Planning
                onDialogClose={hideModal}
                asDialog
                setNewItem={setNewItem}
                id={initialDocument[0]}
                document={initialDocument[1]}
              />
            )
          }}
        >
          <div className='bg-primary rounded-full w-5 h-5 relative'>
            <PlusIcon
              size={15}
              strokeWidth={2.25}
              color='#FFFFFF'
              className='absolute inset-0 m-auto'
            />
          </div>
          Lägg till planering
        </Button>
      </div>

      <div className='text-sm font-bold pt-2'>Relaterade planeringar</div>
      {data?.map((planning) => (
        <div key={planning.id}>
          <a
            href='#'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
            onClick={(evt) => {
              openPlanning(evt, { id: planning.id })
            }}
          >
            <GanttChartSquare strokeWidth={1.75} size={18} className='text-muted-foreground' />
            {planning.fields['document.title']?.values[0]}
          </a>
        </div>
      ))}
      {asDialog && (
        <NewItems.Root>
          <NewItems.List type='Planning' createdIdRef={createdDocumentIdRef} asDialog={asDialog} />
        </NewItems.Root>
      )}
    </div>
  )
}
