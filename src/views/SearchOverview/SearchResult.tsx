import { useMemo, type JSX } from 'react'
import { Table } from '@/components/Table'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { Toolbar } from './Toolbar'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useAuthors } from '@/hooks/useAuthors'
import type { Event, EventFields } from '@/shared/schemas/event'
import type { Planning, PlanningFields } from '@/shared/schemas/planning'
import type { Article } from '@/shared/schemas/article'
import { useDocuments } from '@/hooks/index/useDocuments'
import { createSearchColumns } from './lib/createSearchColumns'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import search from '@/hooks/index/useDocuments/queries/views/search'
import { useQuery } from '@/hooks/useQuery'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import type { View } from '@/types/index'
import { TableSkeleton } from '@/components/Table/Skeleton'

const searchTypeToView: Record<SearchKeys, View> = {
  plannings: 'Planning',
  events: 'Event',
  articles: 'Editor'
}

export const SearchResult = ({ searchType, page }: {
  searchType: SearchKeys
  page: number
}): JSX.Element => {
  const sections = useSections()
  const organisers = useOrganisers()
  const authors = useAuthors()
  const [filter] = useQuery()

  const { locale, timeZone } = useRegistry()

  const searchParams = search[searchType].params(filter)

  const { error, isLoading } = useDocuments<Planning | Event | Article, PlanningFields | EventFields>({
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

  if (isLoading) {
    return <TableSkeleton columns={columns as ColumnDef<Planning | Event>[]} />
  }

  return (
    <>
      <Table
        columns={columns as ColumnDef<Planning | Event>[]}
        resolveNavigation={(row) => ({
          id: row.id,
          opensWith: searchTypeToView[searchType]
        })}
      >
        <Toolbar type={searchType} />
      </Table>
    </>
  )
}
