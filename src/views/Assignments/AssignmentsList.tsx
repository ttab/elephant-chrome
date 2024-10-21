import { useMemo } from 'react'
import useSWR from 'swr'
import { useAuthors, useIndexUrl, useTable, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Assignments } from '@/lib/index'
import { Table } from '@/components/Table'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { assignmentColumns } from './AssignmentColumns'
import { transformAssignments } from './lib/transformAssignments'
import { type AssignmentMetaExtended } from './types'

export const AssignmentsList = ({ startDate }: { startDate: string }): JSX.Element => {
  const { setData } = useTable<AssignmentMetaExtended>()
  const { data: session, status } = useSession()
  const { locale, timeZone } = useRegistry()
  const indexUrl = useIndexUrl()
  const authors = useAuthors()
  const { startTime, endTime } = getDateTimeBoundaries(new Date(startDate))
  const searchUrl = useMemo(() => {
    if (!indexUrl) {
      return
    }

    const start = convertToISOStringInUTC(startTime)
    const end = convertToISOStringInUTC(endTime)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl])

  useSWR(searchUrl?.href, async (): Promise<void> => {
    if (status !== 'authenticated' || !searchUrl) {
      return
    }
    const start = searchUrl.searchParams.get('start')
    const end = searchUrl.searchParams.get('end')

    if (start === null || end === null) {
      throw new Error('Start or end cant be null')
    }

    const items: AssignmentMetaExtended[] = []
    let page = 1
    const searchSize = 100
    const endpoint = new URL('/twirp/elephant.index.SearchV1/Query', indexUrl)
    while (true) {
      const result = await Assignments.search({ endpoint, accessToken: session.accessToken, start: startTime, page, size: searchSize })
      if (result?.hits?.hits?.length > 0) {
        const assignments: AssignmentMetaExtended[] = transformAssignments(result)
        items.push(...assignments)
      }
      if (result.hits.hits.length < searchSize) {
        break
      }
      page++
    }
    items.sort((a, b) => {
      if (a.newsvalue > b.newsvalue) return -1
      if (a.newsvalue < b.newsvalue) return 1
      if (a.data.start < b.data.start) return -1
      if (a.data.start > b.data.start) return 1
      return 0
    })
    setData(items)
  })

  return (
    <Table
      type='Planning'
      columns={assignmentColumns({ authors, locale, timeZone })}

      onRowSelected={(row): void => {
        if (row) {
          console.info(`Selected assignment item ${row.id}`)
        } else {
          console.info('Deselected row')
        }
      }}
    />
  )
}
