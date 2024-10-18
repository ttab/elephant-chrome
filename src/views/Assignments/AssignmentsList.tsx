import { useMemo } from 'react'
import useSWR from 'swr'
import { useAuthors, useIndexUrl, useTable, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { Assignments } from '@/lib/index'
import { Table } from '@/components/Table'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { assignmentColumns } from './AssignmentColumns'
import { transformAssignments } from './lib/transformAssignments'
import { type AssignmentMeta } from './types'

export const AssignmentsList = ({ startDate }: { startDate: string }): JSX.Element => {
  const { setData } = useTable<AssignmentMeta>()
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

    const endpoint = new URL('/twirp/elephant.index.SearchV1/Query', indexUrl)
    const result = await Assignments.search({ endpoint, accessToken: session.accessToken, start: startTime })
    if (result?.hits?.hits?.length > 0) {
      const assignments = transformAssignments(result)
      setData(assignments)
    }
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
