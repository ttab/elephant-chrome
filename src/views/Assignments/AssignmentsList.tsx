import { useMemo } from 'react'
import useSWR from 'swr'
import { useAuthors, useIndexUrl, useTable, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import {
  Assignments
} from '@/lib/index'
import { Table } from '@/components/Table'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { type AssignmentMeta } from './types'

import { assignmentColumns } from './AssignmentColumns'
import { getAllAssignments } from './lib'


export const AssignmentsList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<AssignmentMeta>()
  const { data: session, status } = useSession()
  const { locale, timeZone } = useRegistry()

  const indexUrl = useIndexUrl()
  const authors = useAuthors()
  const { startTime, endTime } = getDateTimeBoundaries(date)

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
    if (status !== 'authenticated' || !indexUrl) {
      return
    }

    const url = new URL('/twirp/elephant.index.SearchV1/Query', indexUrl)
    const result = await Assignments.search(url, session.accessToken)
    if (result?.hits?.hits?.length > 0) {
      const assignments = getAllAssignments(result)
      setData(assignments)
    }
  })

  return (
    <Table
      type='Assignments'
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
