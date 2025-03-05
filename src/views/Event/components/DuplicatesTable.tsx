import { useIndexUrl } from '@/hooks/useIndexUrl'
import { Events } from '@/lib/events'
import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import type { FormProps } from '@/components/Form/Root'
import { format } from 'date-fns'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { useRef } from 'react'
import { Link } from '@/components/index'

interface DuplicatesResult {
  title: string | undefined
  uuid: string | undefined
  start: string | undefined
}

export const DuplicatesTable = ({ documentId }: {
  documentId: string
} & FormProps): JSX.Element => {
  const { data: session, status } = useSession()
  const indexUrl = useIndexUrl()
  const createdDocumentIdRef = useRef<string | undefined>()

  const { data, mutate, error } = useSWR<DuplicatesResult[] | undefined, Error>([
    `duplicates/${documentId}`,
    status,
    indexUrl.href
  ], async (): Promise<DuplicatesResult[] | undefined> => {
    if (status !== 'authenticated') {
      throw new Error('Not authenticated')
    }

    const statusResults = await Events.listDuplicates(indexUrl, session.accessToken, documentId)

    return statusResults.hits.map((hit) => {
      const [start] = hit._source['document.meta.core_event.data.start']
      const [title] = hit._source['document.title']

      return {
        title,
        uuid: hit._id,
        start: format(new Date(start), 'yyyy-MM-dd')
      }
    })
  })

  useRepositoryEvents('core/event', (event) => {
    if (createdDocumentIdRef.current === event.uuid && event.type === 'document') {
      void (async () => {
        try {
          await mutate()
        } catch (error) {
          console.warn('Failed to update event item', error)
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
    <div className='pl-6 border-t'>
      <div className='text-sm font-bold pt-2'>Duplicerade händelser</div>
      {data?.map((duplicate: DuplicatesResult) => (
        <div key={duplicate.uuid} className='pt-2'>
          <Link to='Event' props={{ id: duplicate.uuid }} target='last'>
            <div className='flex items-center gap-2'>
              <CalendarPlus2 strokeWidth={1.75} size={18} className='text-muted-foreground' />
              <div className='text-sm'>{duplicate.title}</div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
