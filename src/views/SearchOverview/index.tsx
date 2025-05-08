import { useMemo, useState } from 'react'
import { View, ViewHeader } from '@/components'
import { SearchBar } from './SearchBar'
import { TableProvider } from '@/contexts/TableProvider'
import { SearchResult } from './SearchResult'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { SearchDropdown, searchTypes as validSearchTypes } from './SearchDropdown'
import { Pagination } from '../../components/Table/Pagination'
import { type ViewMetadata } from '@/types'
import { useQuery } from '@/hooks/useQuery'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useAuthors } from '@/hooks/useAuthors'
import { Toolbar } from './Toolbar'
import type { ColumnDef } from '@tanstack/react-table'
import { createSearchColumns } from './lib/createSearchColumns'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import type { Planning } from '@/hooks/index/useDocuments/schemas/planning'
import type { Event } from '@/hooks/index/useDocuments/schemas/event'
import type { Article } from '@/hooks/index/useDocuments/schemas/article'

const meta: ViewMetadata = {
  name: 'Search',
  path: `${import.meta.env.BASE_URL}/search`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Search = (): JSX.Element => {
  const [query] = useQuery()
  const startingSearchType: SearchKeys = query.type as SearchKeys || 'plannings'
  const [searchType, setSearchType] = useState<SearchKeys>(startingSearchType)
  const { locale, timeZone } = useRegistry()
  const sections = useSections()
  const organisers = useOrganisers()
  const authors = useAuthors()


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

  if (!validSearchTypes.map((p) => p.value).includes(searchType)) {
    return <></>
  }


  const { type, ...params } = query

  return (
    <View.Root>
      <TableProvider<Planning | Event | Article>
        type={meta.name}
        columns={columns as Array<ColumnDef<Planning | Event | Article, unknown>>}
        initialState={{
          grouping: ['date']
        }}
      >
        <ViewHeader.Root>
          <ViewHeader.Title name='Search' title='Sök' />

          <ViewHeader.Content>
            {!Object.keys(params).length
              ? null
              : (
                  <>
                    <SearchBar searchType={searchType} page={Number(query.page)} />
                    <SearchDropdown searchType={searchType} setSearchType={setSearchType} />
                  </>
                )}
          </ViewHeader.Content>
        </ViewHeader.Root>

        <View.Content>
          {!Object.keys(params).length
            ? (
                <div className='w-3/4 h-fit mt-10 bg-slate-200 p-6 m-auto'>
                  <div className='flex flex-col gap-2 w-full items-center'>
                    <SearchBar width='w-full' searchType={searchType} page={0} />
                    <div className='flex gap-2 w-full justify-center'>
                      <SearchDropdown searchType={searchType} setSearchType={setSearchType} />
                      <Toolbar type={searchType} />
                    </div>
                  </div>
                </div>
              )
            : (
                <>
                  <SearchResult searchType={searchType} page={Number(query?.page || 1)} />
                  <div className='flex justify-center w-full'>
                    <Pagination />
                  </div>
                </>
              )}
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Search.meta = meta
