import { useCallback, useMemo } from 'react'
import { Table } from '@/components/Table'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { LoadingText } from '@/components/LoadingText'
import { Toolbar } from './Toolbar'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useAuthors } from '@/hooks/useAuthors'
import type { Event, EventFields } from '@/hooks/index/useDocuments/schemas/event'
import type { Planning, PlanningFields } from '@/hooks/index/useDocuments/schemas/planning'
import type { Article, ArticleFields } from '@/hooks/index/useDocuments/schemas/article'
import { useDocuments } from '@/hooks/index/useDocuments'
import { createSearchColumns } from './lib/createSearchColumns'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import search from '@/hooks/index/useDocuments/queries/views/search'
import { useQuery } from '@/hooks/useQuery'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

export const SearchResult = ({ searchType, page }: {
  searchType: SearchKeys
  page: number
}): JSX.Element => {
  const sections = useSections()
  const organisers = useOrganisers()
  const authors = useAuthors()
  const [filter] = useQuery()

  const { locale, timeZone } = useRegistry()
  const getType = (searchType: SearchKeys) => searchType === 'events' ? 'Event' : searchType === 'articles' ? 'Editor' : 'Planning'

  const onRowSelected = useCallback((row?: Planning | Event) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  const searchParams = search[searchType].params(filter)

  const { error, isLoading } = useDocuments<Planning | Event | Article, PlanningFields | EventFields | ArticleFields>({
    ...searchParams,
    page,
    options: {
      setTableData: true
    }
  })

  const columns = useMemo(() => {
    return createSearchColumns({
      searchType,
      sections,
      authors,
      locale,
      timeZone,
      organisers
    })
  }, [locale, timeZone, authors, sections, searchType, organisers])

  if (error) {
    console.error('Error fetching search result items:', error)
    toast.error('Kunde inte hämta sökresultat')
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
                columns={columns as ColumnDef<Planning | Event>[]}
                onRowSelected={onRowSelected}
              />
            </>
          )}
    </>
  )
}
