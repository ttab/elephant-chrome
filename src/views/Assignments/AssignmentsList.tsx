import { useMemo } from 'react'
import useSWR from 'swr'
import { useAuthors, useIndexUrl, useTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import {
  type SearchIndexResponse,
  Assignments
} from '@/lib/index'
import { type Assignment } from '@/lib/index/schemas/assignment'

import { Table } from '@/components/Table'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { assignmentColumns } from './AssignmentColumns'

export const AssignmentsList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<Assignment>()
  const { data: session, status } = useSession()

  const indexUrl = useIndexUrl()
  const authors = useAuthors()
  const { startTime, endTime } = getDateTimeBoundaries(date)

  // Create url to base SWR caching on
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

  const { data } = useSWR(searchUrl?.href, async (): Promise<SearchIndexResponse<Assignment> | undefined> => {
    if (status !== 'authenticated' || !indexUrl) {
      return
    }

    const result = await Assignments.search(indexUrl, session.accessToken, {
      size: 100
    })
    if (result.ok) {
      console.log(result.hits.slice(0, 5))
      setData(result)
      return result
    }
  })

  return (
    <>
      {data?.ok === true &&
        <Table
          type='Assignments'
          columns={assignmentColumns({ authors })}
          onRowSelected={(row): void => {
            if (row) {
              console.info(`Selected assignment item ${row._id}`)
            } else {
              console.info('Deselected row')
            }
          }}
        />
      }
    </>
  )
}
