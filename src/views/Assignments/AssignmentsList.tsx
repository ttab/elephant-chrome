import { useMemo } from 'react'
import useSWR from 'swr'
import { useIndexUrl, useTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import {
  Assignments
} from '@/lib/index'
import { Table } from '@/components/Table'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { type MetaTwo, type Item } from './types'

import { assignmentColumns } from './AssignmentColumns'
import { getAllAssignments, getAssignments, getNewsvalue } from './lib'

export const AssignmentsList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<Item>()
  const { data: session, status } = useSession()

  const indexUrl = useIndexUrl()
  // const authors = useAuthors()
  // const sections = useSections()
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
    let result = await Assignments.search(url, session.accessToken)
    if (result?.hits?.hits?.length > 0) {
      const allassignments = getAllAssignments(result)
      // console.log('🍄 ~ useSWR ~ allassignments ✅ ', allassignments)
      result = {
        ...result,
        hits: {
          hits: allassignments
        }
      }
      setData(result.hits)
    }
  })

  return (
    <Table
      type='Assignments'
      columns={assignmentColumns()}
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
