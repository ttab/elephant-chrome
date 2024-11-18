import { useMemo, useState } from 'react'
import { ViewHeader } from '@/components'
import { SearchIcon } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'
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
  const [currentTab, setCurrentTab] = useState<string>('list')
  const [isLoading, setLoading] = useState<boolean>(false)
  const [total, setTotalHits] = useState<number>(0)

  const [{ page = '1', query, type }] = useQuery()
  const { locale, timeZone } = useRegistry()
  const sections = useSections()
  const [pool, setPool] = useState<string>(type || 'plannings')
  const columns = useMemo(() => searchWideColumns({ locale, timeZone, sections }), [locale, timeZone, sections])


  if (!validPools.map((p) => p.value).includes(pool)) {
    return <></>
  }

  return (
    <TableProvider<Planning | Event | AssignmentMetaExtended | Article> columns={columns}>
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

        <TableCommandMenu heading='Search'>
          <Commands />
        </TableCommandMenu>

        <div className='flex flex-col h-screen'>
          <ViewHeader.Root>
            <ViewHeader.Title
              title='Sök'
              short='Sök'
              icon={SearchIcon}
              iconColor='#F06F21'
            />

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

          <ScrollArea>
            <TabsContent value='list' className='mt-0'>
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
            </TabsContent>
          </ScrollArea>
        </div>
      </Tabs>

    </TableProvider>
  )
}

Search.meta = meta
