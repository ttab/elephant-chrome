import useSWR from 'swr'
import { Newsvalue } from './Items/Newsvalue'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Title } from '@/components/Table/Items/Title'
import { SectionBadge } from '../DataItem/SectionBadge'
import { type EleDocumentResponse } from '@/shared/types'
import { Button, Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { DocumentStatus } from './Items/DocumentStatus'
import { StatusIndicator } from '../DataItem/StatusIndicator'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { AwarenessDocument } from '../AwarenessDocument'
import { useLink } from '@/hooks/useLink'
import { Check, CheckCheck } from '@ttab/elephant-ui/icons'


export const NewItems = (): JSX.Element | null => {
  const { data } = useSession()
  return data?.user.sub
    ? (
      <AwarenessDocument documentId={data?.user.sub}>
        <NewItemsContent />
      </AwarenessDocument>)
    : null
}
export const NewItemsContent = (): JSX.Element | null => {
  const openPlanningView = useLink('Planning')
  const [plannings, setPlannings] = useYValue<string[]>('plannings')

  const { data: documents, error } = useSWR(
    plannings?.length ? plannings : null,
    async (plannings: string[]): Promise<EleDocumentResponse[]> => {
      const results = await Promise.all(plannings.map(async planning => {
        const response = await fetch(`${process.env.BASE_URL}/api/documents/${planning}`)
        const result = await response.json()
        return result
      }))
      return results
    }
  )

  if (error) return <div>Failed to load</div>
  if (!documents) return null


  return (
    <Table className='table-auto w-full relative'>
      <TableBody className='[&_tr:last-child]:border-b'>
        <TableRow className='bg-muted'>
          <TableCell colSpan={8} className='flex justify-between items-center px-2 py-1 border-b'>
            <span className='text-sm font-thin text-muted-foreground'>Dina senaste planeringar</span>
            <Button
              variant='icon'
              size='xs'
              onClick={() => setPlannings([])}
              >
              <CheckCheck size={18} strokeWidth={1.75} />
            </Button>
          </TableCell>
        </TableRow>

        {documents.map((doc, index: number) => {
          const { document } = doc
          const newsvalue = document?.meta && NewsvalueMap[document?.meta['core/newsvalue']?.[0]?.value]
          const title = document?.title || ''
          const slugline = document?.meta['tt/slugline']?.[0]?.value || 'N/A'
          const section = document?.links['core/section']?.[0]?.title || 'N/A'
          const visibility = document?.meta['core/planning-item']?.[0]?.data?.public === 'true' ? 'public' : 'internal'

          return (
            <TableRow
              key={index}
              className='flex items-center cursor-default'
              onClick={(event) => openPlanningView(event, {
                id: document?.uuid
              })}
            >
              <TableCell className='flex-none first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6'>
                {newsvalue && <Newsvalue newsvalue={newsvalue} />}
              </TableCell>
              <TableCell className='flex-none first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6'>
                <DocumentStatus status='draft' />
              </TableCell>
              <TableCell className='flex-none first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6'>
                <StatusIndicator visibility={visibility} />
              </TableCell>
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
                    if (plannings?.length) {
                      setPlannings(plannings.filter((planning) => planning !== document?.uuid))
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
    </Table>
  )
}
