import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
import { Table } from '@/components/Table'
import { searchWideColumns } from './SearchColumns'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { type Article, type Event, type Planning } from '@/lib/index'
import { type AssignmentMetaExtended } from '../Assignments/types'
import { LoadingText } from '@/components/LoadingText'

export const SearchResult = ({ from, to, isLoading, pool, page }: {
  from: string
  to: string
  isLoading: boolean
  pool: string
  page: number
}): JSX.Element => {
  const sections = useSections()
  const { error } = useSWR(['Search', pool, page, from, to, { withStatus: true }])
  const { locale, timeZone } = useRegistry()
  const onRowSelected = useCallback((row?: Planning | Event | AssignmentMetaExtended | Article) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  const columns = useMemo(() => searchWideColumns({ locale, timeZone, sections }), [locale, timeZone, sections])

  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <>
      {isLoading
        ? (
            <LoadingText>Laddar...</LoadingText>
          )
        : (
            <Table
              type='Planning'
              columns={columns}
              onRowSelected={onRowSelected}
            />
          )}
    </>
  )
}
