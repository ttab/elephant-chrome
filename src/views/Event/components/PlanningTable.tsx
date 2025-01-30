import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
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

interface StatusResult {
  title: string
  uuid: string | undefined
}

export const PlanningTable = ({ templateValues, asDialog }: {
  templateValues: {
    eventId: string
    eventTitle?: string
    eventSection?: string
    newsvalue?: string
    story?: string
  }
} & FormProps): JSX.Element => {
  const { data: session, status } = useSession()
  const openPlanning = useLink('Planning')
  const createdDocumentIdRef = useRef<string | undefined>()
  const indexUrl = useIndexUrl()

  const { data, mutate, error } = useSWR<StatusResult[] | undefined, Error>([
    `relatedPlanningItems/${templateValues.eventId}`,
    status,
    indexUrl.href
  ], async (): Promise<StatusResult[] | undefined> => {
    if (status !== 'authenticated') {
      throw new Error('Not authenticated')
    }
    const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, [templateValues.eventId], {
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
      <div className='flex flex-start pb-2'>
        <CreateDocumentDialog
          type='Planning'
          payload={{ ...templateValues, createdDocumentIdRef }}
          createdDocumentIdRef={createdDocumentIdRef}
        >
          <a
            href='#'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
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
          </a>
        </CreateDocumentDialog>
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
          <NewItems.List type='Planning' createdIdRef={createdDocumentIdRef} />
        </NewItems.Root>
      )}
    </div>
  )
}
