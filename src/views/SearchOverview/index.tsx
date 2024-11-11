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
import { PoolDropdown } from './PoolDropdown'
import { Pagination } from './Pagination'
import { searchWideColumns } from './SearchColumns'
import { type ViewMetadata } from '@/types'
import { type Planning, type Event, Article } from '@/lib/index'
import { type AssignmentMetaExtended } from '../Assignments/types'

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
  const [pool, setPool] = useState<string>('plannings')
  const [page, setPage] = useState<number>(1)
  const [total, setTotalHits] = useState<number>(0)
  const { locale, timeZone } = useRegistry()
  const sections = useSections()
  const columns = useMemo(() => searchWideColumns({ locale, timeZone, sections }), [locale, timeZone, sections, isLoading])

  return (
    <TableProvider<Planning | Event | AssignmentMetaExtended | Article> columns={columns}>
        <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

          <TableCommandMenu heading='Search'>
            <Commands />
          </TableCommandMenu>

          <div className="flex flex-col h-screen">
            <ViewHeader.Root>
              <ViewHeader.Title
                title="Sök"
                short="Sök"
                icon={SearchIcon}
                iconColor='#F06F21'
              />

              <ViewHeader.Content>
                <SearchBar setTotalHits={setTotalHits} setLoading={setLoading} pool={pool} page={page} />
                <PoolDropdown pool={pool} setPool={setPool} />
                <Pagination page={page} setPage={setPage} total={total} />
              </ViewHeader.Content>
            </ViewHeader.Root>

            <ScrollArea>
              <TabsContent value='list' className='mt-0'>
                <SearchResult from={''} to={''} isLoading={isLoading} pool={pool} page={page} />
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

    </TableProvider>
  )
}

Search.meta = meta
