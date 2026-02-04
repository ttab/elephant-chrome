import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { GanttChartSquareIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { useRef, useState, useEffect, type JSX } from 'react'
import { NewItems } from '@/components/Table/NewItems'
import type { FormProps } from '@/components/Form/Root'
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Separator } from '@ttab/elephant-ui'
import { Planning } from '@/views/Planning'
import { useModal } from '@/components/Modal/useModal'
import { createPayload } from '@/shared/templates/lib/createPayload'
import { useDocuments } from '@/hooks/index/useDocuments'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { Link } from '@/components/index'
import type { Planning as PlanningType } from '@/shared/schemas/planning'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { Block, type Document } from '@ttab/elephant-api/newsdoc'
import { useTranslation } from 'react-i18next'

export type NewItem = { title: string, uuid: string } | undefined
type PlanningTableFields = ['document.title', 'document.rel.event.uuid']

export const PlanningTable = ({ ydoc, asDialog }: {
  ydoc: YDocument<Y.Map<unknown>>
} & FormProps): JSX.Element => {
  const createdDocumentRef = useRef<[string, Document] | []>([])
  const { hideModal } = useModal()
  const [newItem, setNewItem] = useState<NewItem>()
  const [nestedDialogOpen, setNestedOpen] = useState<boolean>(false)
  const { t } = useTranslation()

  useEffect(() => {
    return () => {
      setNestedOpen(false)
    }
  }, [])

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
                values: [ydoc.id]
              })
            }
          }
          ]
        })
      }
    })
  })

  useRepositoryEvents('core/planning-item', (event) => {
    if (createdDocumentRef.current[0] === event.uuid && event.type === 'core/planning-item' && event.event === 'document') {
      void (async () => {
        try {
          if (Array.isArray(data) && newItem?.title) {
            const createdId = createdDocumentRef.current[0]
            // Check if the createdId is already in the data, if so, noop
            if (typeof createdId === 'string' && data.some((planning) => planning.id === createdId)) {
              return
            }
            await mutate([...data, {
              source: {},
              score: 1,
              sort: [''],
              fields: {
                'document.title': {
                  values: [newItem?.title]
                },
                'document.rel.event.uuid': {
                  values: [ydoc.id]
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
    return <>{t('common:misc.loading')}</>
  }

  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <div className='flex flex-col items-start'>
      <Dialog open={nestedDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant='ghost'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100 dark:hover:bg-table-focused'
            onClick={(e) => {
              setNestedOpen(true)
              e.stopPropagation()
              const eventData = ydoc.provider?.document
                ? createPayload(ydoc.provider.document)
                : undefined


              const payload = {
                ...eventData || {},
                links: {
                  ...eventData?.links,
                  'core/event': [Block.create({
                    type: 'core/event',
                    uuid: ydoc.id,
                    title: eventData?.title || 'Titel saknas',
                    rel: 'event'
                  })]
                }
              }

              const id = crypto.randomUUID()

              createdDocumentRef.current = [
                id,
                getTemplateFromView('Planning')(id, payload)
              ]
            }}
          >
            <div className='bg-primary rounded-full w-5 h-5 relative'>
              <PlusIcon
                size={15}
                strokeWidth={2.25}
                className='text-white dark:text-black absolute inset-0 m-auto'
              />
            </div>
            {t('event:buttons.addPlanning')}
          </Button>
        </DialogTrigger>
        <DialogContent className='gap-0 p-0'>
          <DialogDescription />
          <DialogTitle />
          <Planning
            onDialogClose={() => setNestedOpen(!nestedDialogOpen)}
            asDialog
            setNewItem={setNewItem}
            id={createdDocumentRef.current[0]}
            document={createdDocumentRef.current[1]}
          />
        </DialogContent>
      </Dialog>
      <div className='pl-6 w-full'>
        {data?.length > 0 && (
          <>
            <Separator />
            <div className='flex gap-2 items-center'>
              <GanttChartSquareIcon color='#FF971E' strokeWidth={1.75} size={18} className='text-muted-foreground' />
              <div className='text-muted-foreground py-2'>{t('event:subheadings.plannings')}</div>
            </div>
            {data?.map((planning) => (
              <Link key={planning.id} to='Planning' props={{ id: planning.id }} target='last'>
                <div
                  className='w-fit text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-table-focused p-1 rounded-sm'
                  onClick={() => {
                    setNestedOpen(false)
                    if (asDialog) {
                      hideModal()
                    }
                  }}
                >
                  {planning.fields['document.title']?.values[0]}
                </div>
              </Link>
            ))}
          </>
        )}
        {asDialog && (
          <NewItems.Root>
            <NewItems.List type='Planning' createdId={createdDocumentRef.current[0]} asDialog={asDialog} />
          </NewItems.Root>
        )}
      </div>
    </div>
  )
}
