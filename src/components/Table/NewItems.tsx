import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Newsvalue } from './Items/Newsvalue'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Title } from '@/components/Table/Items/Title'
import { SectionBadge } from '../DataItem/SectionBadge'
import { type EleBlock } from '@/shared/types'
import { Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'

export const NewItems = (): JSX.Element => {
  const { data: newItems } = useSWR(`${process.env.BASE_URL}/api/user`, async () => await fetch(`${process.env.BASE_URL}/api/user`).then(async res => await res.json()))
  const [documents, setDocuments] = useState<EleBlock[]>([])

  useEffect(() => {
    const fetchDocuments = async (): Promise<void> => {
      if (newItems?.plannings) {
        const docs = await Promise.all(newItems.plannings.map(async (planning: string) => {
          const res = await fetch(`${process.env.BASE_URL}/api/documents/${planning}`)
          return await res.json()
        }))
        setDocuments(docs)
      }
    }
    fetchDocuments().catch(console.error)
  }, [newItems])


  return (
    <Table className='table-auto w-full relative'>
      <TableBody>
        <TableRow className='bg-muted'>
          <TableCell colSpan={8}>
            <span className='text-sm font-thin text-muted-foreground'>Dina senaste planeringar</span>
          </TableCell>
        </TableRow>
        {documents.map((doc, index) => {
          const { document } = doc
          const newsvalue = NewsvalueMap[document.meta['core/newsvalue']?.[0]?.value]
          const title = document.title || 'N/A'
          const slugline = document.meta['tt/slugline']?.[0]?.value || 'N/A'
          const section = document.links['core/section']?.[0]?.title || 'N/A'
          const type = document.type || 'N/A'

          return (
            <TableRow key={index}>
              <TableCell className='box-content pl-6 w-4 sm:w-8 pr-1 sm:pr-4'>
                {newsvalue && <Newsvalue newsvalue={newsvalue} />}
              </TableCell>
              <TableCell className='box-content w-6 pr-0'>
              </TableCell>
              <TableCell className='box-content w-6 pr-0'>
              </TableCell>
              <TableCell className='box-content truncate'>
                <Title title={title as string} slugline={slugline} />
              </TableCell>
              <TableCell className='box-content w-[115px] hidden @4xl/view:[display:revert]'>
                {section && <SectionBadge title={section} color='bg-[#BD6E11]' />}
              </TableCell>
              <TableCell className='box-content w-[112px] hidden @5xl/view:[display:revert]'>
              </TableCell>
              <TableCell className='box-content w-[120px] hidden @6xl/view:[display:revert]'>
              </TableCell>
              <TableCell className='box-content w-[55px]'>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
