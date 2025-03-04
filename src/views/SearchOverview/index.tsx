import { useMemo, useState } from 'react'
import { View, ViewHeader } from '@/components'
import { SearchBar } from './SearchBar'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Commands } from '@/components/Commands'
import { TableProvider } from '@/contexts/TableProvider'
import { SearchResult } from './SearchResult'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { PoolDropdown, pools as validPools } from './PoolDropdown'
import { Pagination } from '../../components/Table/Pagination'
import { searchWideColumns } from './SearchColumns'
import { type ViewMetadata } from '@/types'
import { type Planning, type Event, type Article } from '@/lib/index'
import { type AssignmentMetaExtended } from '../Assignments/types'
import { useQuery } from '@/hooks/useQuery'

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

  const [{ page = '1', query, type }] = useQuery()
  const { locale, timeZone } = useRegistry()
  const sections = useSections()
  const [pool, setPool] = useState<string>(typeof type === 'string' ? type : 'plannings')
  const columns = useMemo(() => searchWideColumns({ locale, timeZone, sections }), [locale, timeZone, sections])


  if (!validPools.map((p) => p.value).includes(pool)) {
    return <></>
  }

  return (
    <View.Root>
      <TableProvider<Planning | Event | AssignmentMetaExtended | Article>
        type={meta.name}
        columns={columns}
      >

        <TableCommandMenu heading='Search'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Title name='Search' title='Sök' />

          <ViewHeader.Content>
            {!query
              ? null
              : (
                  <>
                    <SearchBar setTotalHits={setTotalHits} setLoading={setLoading} pool={pool} page={Number(page)} />
                    <PoolDropdown pool={pool} setPool={setPool} />
                  </>
                )}
          </ViewHeader.Content>
        </ViewHeader.Root>

        <View.Content>
          {!query
            ? (
                <div className='w-3/4 h-fit mt-10 bg-slate-200 flex justify-self-center p-6'>
                  <div className='flex flex-col gap-2 w-full items-center'>
                    <div className='flex gap-2 w-full justify-center'>
                      <PoolDropdown pool={pool} setPool={setPool} />
                    </div>
                    <SearchBar width='w-full' setTotalHits={setTotalHits} setLoading={setLoading} pool={pool} page={Number(page)} />
                  </div>
                </div>
              )
            : (
                <>
                  <SearchResult from='' to='' isLoading={isLoading} pool={pool} page={Number(page)} />
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
