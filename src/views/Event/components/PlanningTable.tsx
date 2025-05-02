import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { Events } from '@/lib/events'
import { GanttChartSquare, PlusIcon } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useRef, useState, useEffect } from 'react'
import { NewItems } from '@/components/Table/NewItems'
import useSWR from 'swr'
import type { FormProps } from '@/components/Form/Root'
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Separator } from '@ttab/elephant-ui'
import { createDocument } from '@/lib/createYItem'
import { Planning } from '@/views/Planning'
import { useModal } from '@/components/Modal/useModal'
import * as Templates from '@/defaults/templates'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { Block } from '@ttab/elephant-api/newsdoc'
import type { Doc } from 'yjs'
import { Link } from '@/components/index'

interface StatusResult {
  title: string
  uuid: string | undefined
}

export type NewItem = { title: string, uuid: string } | undefined

export const PlanningTable = ({ provider, documentId, asDialog }: {
  documentId: string
  provider?: HocuspocusProvider
} & FormProps): JSX.Element => {
  const { data: session, status } = useSession()
  const createdDocumentIdRef = useRef<string | undefined>()
  const indexUrl = useIndexUrl()
  const { hideModal } = useModal()
  const [newItem, setNewItem] = useState<NewItem>()
  const [initialDocument, setInitialDocument] = useState<Doc>()
  const [initialId, setInitialDocId] = useState<string>()
  const [nestedDialogOpen, setNestedOpen] = useState<boolean>(false)

  useEffect(() => {
    return () => {
      setNestedOpen(false)
    }
  }, [])

  const { data, mutate, error } = useSWR<StatusResult[] | undefined, Error>([
    `relatedPlanningItems/${documentId}`,
    status,
    indexUrl.href
  ], async (): Promise<StatusResult[] | undefined> => {
    if (status !== 'authenticated' || !session?.accessToken) {
      throw new Error('Not authenticated')
    }

    const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, [documentId], {
      size: 100
    })

    return statusResults.hits.map((hit) => ({
      title: hit._source['document.title'][0],
      uuid: hit._id
    }))
  })

  useRepositoryEvents('core/planning-item', (event) => {
    if (createdDocumentIdRef.current === event.uuid && event.type === 'core/planning-item' && event.event === 'document') {
      void (async () => {
        try {
          if (Array.isArray(data) && newItem?.title) {
            await mutate([...data, { title: newItem?.title, uuid: newItem?.uuid }], { revalidate: false })
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
    <div className='flex flex-col items-start'>
      <Dialog open={nestedDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant='ghost'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
            onClick={(e) => {
              setNestedOpen(true)
              e.stopPropagation()
              const payload = provider?.document
                ? createPayload(provider.document)
                : undefined

              const [docId, initialDocument] = createDocument({
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

              setInitialDocument(initialDocument)
              setInitialDocId(docId)
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
        </DialogTrigger>
        <DialogContent>
          <DialogDescription />
          <DialogTitle />
          <Planning
            onDialogClose={() => setNestedOpen(!nestedDialogOpen)}
            asDialog
            setNewItem={setNewItem}
            id={initialId}
            document={initialDocument}
          />
        </DialogContent>
      </Dialog>
      <div className='pl-6'>
        {data?.length > 0 && (
          <>
            <Separator />
            <div className='text-muted-foreground py-2'>Planeringar</div>
            {data?.map((planning) => (
              <Link key={planning.uuid} to='Planning' props={{ id: planning.uuid }} target='last'>
                <div
                  className='text-sm flex items-center gap-2 hover:bg-gray-100'
                  onClick={() => {
                    setNestedOpen(false)
                    if (asDialog) {
                      hideModal()
                    }
                  }}
                >
                  <GanttChartSquare strokeWidth={1.75} size={18} className='text-muted-foreground' />
                  {planning.title}
                </div>
              </Link>
            ))}
          </>
        )}
        {asDialog && (
          <NewItems.Root>
            <NewItems.List type='Planning' createdIdRef={createdDocumentIdRef} asDialog={asDialog} />
          </NewItems.Root>
        )}
      </div>
    </div>
  )
}
