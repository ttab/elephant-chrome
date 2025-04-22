import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
import { Table } from '@/components/Table'
import { searchColumns } from './SearchColumns'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { LoadingText } from '@/components/LoadingText'
import { Toolbar } from './Toolbar'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useAuthors } from '@/hooks/useAuthors'
import type { Article, Event, Planning } from '@/lib/index'
import type { AssignmentMetaExtended } from '../Assignments/types'
import type { SearchType } from './SearchDropdown'
import type { ColumnDef } from '@tanstack/react-table'
import type { Types } from './search'

export const SearchResult = ({ from, to, isLoading, searchType, page }: {
  from: string
  to: string
  isLoading: boolean
  searchType: SearchType
  page: number
}): JSX.Element => {
  const sections = useSections()
  const organisers = useOrganisers()
  const authors = useAuthors()

  const { locale, timeZone } = useRegistry()
  const { error } = useSWR<unknown, Error>(['Search', searchType, page, from, to, { withStatus: true }])

  const getType = (searchType: SearchType) => searchType === 'events' ? 'Event' : searchType === 'articles' ? 'Editor' : 'Planning'

  const onRowSelected = useCallback((row?: Planning | Event | AssignmentMetaExtended | Article) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  const columns = useMemo(() => {
    return searchColumns({ locale, timeZone, sections, authors, organisers, type: searchType })
  }, [locale, timeZone, authors, sections, organisers, searchType])

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
            <>
              <Toolbar type={searchType} />
              <Table
                type='Search'
                searchType={getType(searchType)}
                columns={columns as Array<ColumnDef<Types, unknown>>}
                onRowSelected={onRowSelected}
              />
            </>
          )}
    </>
  )
}
