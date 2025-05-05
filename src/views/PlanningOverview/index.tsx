import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader, View } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { PlanningList } from './PlanningList'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { planningListColumns } from './PlanningListColumns'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'
import { Commands } from '@/components/Commands'
import { useQuery } from '@/hooks/useQuery'
import { loadFilters } from '@/lib/loadFilters'
import type { Planning } from '@/hooks/index/useDocuments/schemas/planning'

const meta: ViewMetadata = {
  name: 'Plannings',
  path: `${import.meta.env.BASE_URL}/plannings`,
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

export const Plannings = (): JSX.Element => {
  const [query] = useQuery()

  const [currentTab, setCurrentTab] = useState<string>('list')
  const sections = useSections()
  const authors = useAuthors()

  const columns = useMemo(() =>
    planningListColumns({ sections, authors }), [sections, authors])
  const columnFilters = loadFilters<Planning>(query, columns)

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Planning>
        columns={columns}
        type={meta.name}
        initialState={{
          grouping: ['newsvalue'],
          columnFilters,
          globalFilter: query.query
        }}
      >
        <TableCommandMenu heading='Plannings'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Title name='Plannings' title='Planeringar' />
          <ViewHeader.Content>
            <Header type='Planning' />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <PlanningList columns={columns} />
          </TabsContent>

          <TabsContent value='grid'>
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Plannings.meta = meta
