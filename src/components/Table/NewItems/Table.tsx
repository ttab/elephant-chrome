import useSWR from 'swr'
import { Newsvalue } from '../Items/Newsvalue'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Title } from '@/components/Table/Items/Title'
import { SectionBadge } from '../../DataItem/SectionBadge'
import { type EleDocumentResponse } from '@/shared/types'
import { Button, Table as _Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { DocumentStatus } from '../Items/DocumentStatus'
import { useLink } from '@/hooks/useLink'
import { Check, CheckCheck } from '@ttab/elephant-ui/icons'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { useCallback } from 'react'
import { useUser } from '@/hooks/useUserDoc'

const BASE_URL = import.meta.env.BASE_URL || ''

const eventTypes = {
  Event: 'core/event',
  Planning: 'core/planning-item'
} as const

export type EventType = keyof typeof eventTypes
interface NewItem {
  id: string
  timestamp: number
}

export const Table = ({ type, header }: {
  type: EventType
  header: string
}): JSX.Element | null => {
  const openEditingView = useLink(type)

  const [newDocuments = [], setNewDocuments] = useUser<NewItem[]>(type)

  const { data: documents, mutate, error } = useSWR<EleDocumentResponse[], Error>(
    newDocuments?.length ? newDocuments : null,

    async (): Promise<EleDocumentResponse[]> => {
      const results = await Promise.all(newDocuments.map(async (newDocument) => {
        const response = await fetch(`${BASE_URL}/api/documents/${newDocument.id}`)
        const result = await response.json() as EleDocumentResponse
        return result
      }))

      return results
    }
  )

  const eventType = eventTypes[type]

  useRepositoryEvents(
    eventType,
    useCallback((event) => {
      void (async () => {
        const expiredDocuments = newDocuments?.filter(({ timestamp }) => Date.now() - timestamp > (60000 * 10))

        if (event.event === 'document'
          && event.type === 'core/planning-item'
          && expiredDocuments.length
        ) {
          setNewDocuments(newDocuments?.filter(({ id }) => !expiredDocuments.some(({ id: expiredId }) => expiredId === id)))
          await mutate()
        }
        try {
          const expiredDocuments = newDocuments?.filter(({ timestamp }) => Date.now() - timestamp > (60000 * 10))

          if (event.event === 'document'
            && event.type === eventType
            && expiredDocuments.length
          ) {
            setNewDocuments(newDocuments?.filter(({ id }) => !expiredDocuments.some(({ id: expiredId }) => expiredId === id)))
            await mutate()
          }
        } catch (error) {
          console.error(`Error when mutating ${type} list`, error)
        }
      })()
    }, [newDocuments, setNewDocuments, mutate, eventType, type])
  )


  if (error) {
    console.warn('Unable to fetch NewItems: ', error)
    return (
      <div>
        Failed to load:
        {error.message}
      </div>
    )
  }

  if (!documents) return null


  return (
    <_Table className='table-auto w-full relative'>
      <TableBody className='[&_tr:last-child]:border-b'>
        <TableRow className='bg-muted'>
          <TableCell colSpan={8} className='flex justify-between items-center px-2 py-1 border-b'>
            <span className='text-sm font-thin text-muted-foreground'>{header}</span>
            <Button
              variant='icon'
              size='xs'
              onClick={() => setNewDocuments([])}
            >
              <CheckCheck size={18} strokeWidth={1.75} />
            </Button>
          </TableCell>
        </TableRow>

        {documents.map((doc, index: number) => {
          const { document } = doc
          const newsvalue = document?.meta && NewsvalueMap[document?.meta['core/newsvalue']?.[0]?.value]
          const title = document?.title || ''
          const slugline = document?.meta['tt/slugline']?.[0]?.value || ''
          const section = document?.links['core/section']?.[0]?.title

          return (
            <TableRow
              key={index}
              className='flex items-center cursor-default'
              onClick={(event) => openEditingView(event, {
                id: document?.uuid
              })}
            >
              <TableCell className='flex-none first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6'>
                {newsvalue && <Newsvalue newsvalue={newsvalue} />}
              </TableCell>
              {type === 'Planning' && (
                <>
                  <TableCell className='flex-none first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6'>
                    <DocumentStatus status='draft' />
                  </TableCell>
                </>
              )}
              <TableCell className='flex-1 w-[300px]'>
                <Title title={title} slugline={slugline} />

              </TableCell>
              <TableCell className='flex-none hidden @4xl/view:[display:revert] w-[115px] pl-0'>
                {section && <SectionBadge title={section} color='bg-[#BD6E11]' />}
              </TableCell>
              <TableCell className='flex-none hidden @5xl/view:[display:revert] w-[112px]'>
              </TableCell>
              <TableCell className='flex-none hidden @6xl/view:[display:revert] w-[120px]'>
              </TableCell>
              <TableCell className='flex-none w-[55px]'>
                <Button
                  variant='icon'
                  size='xs'
                  onClick={(event) => {
                    event.stopPropagation()
                    if (newDocuments?.length) {
                      setNewDocuments(newDocuments.filter(({ id }) => id !== document?.uuid))
                    }
                  }}
                >
                  <Check size={18} strokeWidth={1.75} />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </_Table>
  )
}
