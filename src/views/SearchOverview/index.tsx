import { useCallback, useMemo, useState } from 'react'
import { View, ViewHeader } from '@/components'
import { SearchBar } from './SearchBar'
import { TableProvider } from '@/contexts/TableProvider'
import { SearchResult } from './SearchResult'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { SearchDropdown, searchTypes as validSearchTypes, type SearchType } from './SearchDropdown'
import { Pagination } from '../../components/Table/Pagination'
import { searchColumns } from './SearchColumns'
import { type ViewMetadata } from '@/types'
import { useQuery } from '@/hooks/useQuery'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useAuthors } from '@/hooks/useAuthors'
import type { Types } from './search'
import { Toolbar } from './Toolbar'
import type { ColumnDef } from '@tanstack/react-table'

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
  const [isLoading, setLoading] = useState<boolean>(false)
  const [total, setTotalHits] = useState<number>(0)
  const [query] = useQuery()
  const startingSearchType: SearchType = query.type as SearchType || 'plannings'
  const [searchType, setSearchType] = useState<SearchType>(startingSearchType)
  const { locale, timeZone } = useRegistry()
  const sections = useSections()
  const organisers = useOrganisers()
  const authors = useAuthors()


  const columns = useMemo(() => {
    return searchColumns({ locale, timeZone, sections, authors, organisers, type: searchType })
  }, [locale, timeZone, authors, sections, organisers, searchType])


  const handleSetTotalHits = useCallback(() => (num: number) => setTotalHits(num), [])

  if (!validSearchTypes.map((p) => p.value).includes(searchType)) {
    return <></>
  }


  const { type, ...params } = query

  return (
    <View.Root>
      <TableProvider<Types>
        type={meta.name}
        columns={columns as Array<ColumnDef<Types, unknown>>}
      >
        <ViewHeader.Root>
          <ViewHeader.Title name='Search' title='Sök' />

          <ViewHeader.Content>
            {!Object.keys(params).length
              ? null
              : (
                  <>
                    <SearchBar setTotalHits={handleSetTotalHits} setLoading={setLoading} searchType={searchType} page={Number(query.page)} />
                    <SearchDropdown searchType={searchType} setSearchType={setSearchType} />
                  </>
                )}
          </ViewHeader.Content>
        </ViewHeader.Root>

        <View.Content>
          {!Object.keys(params).length
            ? (
                <div className='w-3/4 h-fit mt-10 bg-slate-200 flex justify-self-center p-6'>
                  <div className='flex flex-col gap-2 w-full items-center'>
                    <SearchBar width='w-full' setTotalHits={handleSetTotalHits} setLoading={setLoading} searchType={searchType} page={0} />
                    <div className='flex gap-2 w-full justify-center'>
                      <SearchDropdown searchType={searchType} setSearchType={setSearchType} />
                      <Toolbar type={searchType} />
                    </div>
                  </div>
                </div>
              )
            : (
                <>
                  <SearchResult from='' to='' isLoading={isLoading} searchType={searchType} page={Number(query?.page)} />
                  {total > 0
                    ? (
                        <div className='flex justify-center w-full'>
                          <Pagination total={total} />
                        </div>
                      )
                    : null}
                </>
              )}
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Search.meta = meta
