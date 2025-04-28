import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useLink } from '@/hooks/useLink'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { Events } from '@/lib/events'
import { GanttChartSquare, PlusIcon } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useRef } from 'react'
import { NewItems } from '@/components/Table/NewItems'
import useSWR from 'swr'
import type { FormProps } from '@/components/Form/Root'
import { Button } from '@ttab/elephant-ui'
import { createDocument } from '@/lib/createYItem'
import { Planning } from '@/views/Planning'
import { useModal } from '@/components/Modal/useModal'
import * as Templates from '@/defaults/templates'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { Block } from '@ttab/elephant-api/newsdoc'

interface StatusResult {
  title: string
  uuid: string | undefined
}

export const PlanningTable = ({ provider, documentId, asDialog }: {
  documentId: string
  provider?: HocuspocusProvider
} & FormProps): JSX.Element => {
  const { data: session, status } = useSession()
  const openPlanning = useLink('Planning')
  const createdDocumentIdRef = useRef<string | undefined>()
  const indexUrl = useIndexUrl()
  const { showModal, hideModal } = useModal()

  const { data, mutate, error } = useSWR<StatusResult[] | undefined, Error>([
    `relatedPlanningItems/${documentId}`,
    status,
    indexUrl.href
  ], async (): Promise<StatusResult[] | undefined> => {
    if (status !== 'authenticated') {
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
    if (createdDocumentIdRef.current === event.uuid && event.type === 'document') {
      void (async () => {
        try {
          await mutate()
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
              payload: {
                ...payload || {},
                links: {
                  ...payload?.links,
                  'core/event': [Block.create({
                    type: 'core/event',
                    uuid: documentId,
                    title: payload?.title || 'Untitled',
                    rel: 'event'
                  })]
                }
              }
            })

            showModal(
              <Planning
                onDialogClose={hideModal}
                asDialog
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
      {data?.map((planning) => (
        <div key={planning.uuid}>
          <a
            href='#'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
            onClick={(evt) => {
              openPlanning(evt, { id: planning.uuid })
            }}
          >
            <GanttChartSquare strokeWidth={1.75} size={18} className='text-muted-foreground' />
            {planning.title}
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
