import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { useIndexUrl } from '@/hooks/useIndexUrl'
import { useLink } from '@/hooks/useLink'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { Events } from '@/lib/events'
import { CalendarDays, PlusIcon } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useCallback, useRef } from 'react'
import useSWR from 'swr'

export const PlanningTable = ({ eventId, eventTitle }: {
  eventId: string
  eventTitle?: string
}): JSX.Element => {
  const { data: session, status } = useSession()
  const openPlanning = useLink('Planning')
  const createdDocumentIdRef = useRef<string | undefined>()
  const indexUrl = useIndexUrl()

  const { data, mutate } = useSWR([`relatedPlanningItems/${eventId}`, status, indexUrl.href], async (): Promise<Array<{
    title: string
    uuid: string | undefined
  }
  > | undefined> => {
    if (status !== 'authenticated') {
      throw new Error('Not authenticated')
    }
    const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, [eventId], {
      size: 100
    })

    return statusResults.hits.map(hit => ({
      title: hit._source['document.title'][0],
      uuid: hit._id
    }))
  })

  // Mutator function to update the planning table once a new planning is created
  const mutator = useCallback(async (id: string, title: string): Promise<void> => {
    const newData = [...(data || []), { title, uuid: id }]
    await mutate(newData, { optimisticData: newData, revalidate: false })
  }, [data, mutate])

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

  return (
    <div className='flex flex-col gap-2 pt-4'>
      <div className='flex flex-start pb-2'>
        <CreateDocumentDialog
          type='Planning'
          payload={{ eventId, eventTitle, createdDocumentIdRef }}
          mutator={mutator}
        >
          <a
            href='#'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
          >
            <div className='bg-primary rounded-full text-white w-5 h-5 flex justify-center items-center'>
              <PlusIcon size={14} strokeWidth={1.75} className='rounded-full' />
            </div>
            Lägg till planering
          </a>
        </CreateDocumentDialog>
      </div>
      {data?.map(planning => (
        <div key={planning.uuid}>
          <a href='#'
            className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100'
            onClick={(evt) => {
              openPlanning(evt, { id: planning.uuid })
            }}>
            <CalendarDays strokeWidth={1.75} size={18} />
            {planning.title}
          </a>
        </div>))}
    </div>
  )
}
