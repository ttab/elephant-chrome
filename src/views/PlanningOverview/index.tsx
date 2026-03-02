import { useMemo, useState, type JSX } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader, View } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { planningListColumns } from './PlanningListColumns'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'
import { Commands } from '@/components/Commands'
import { useQuery } from '@/hooks/useQuery'
import { useInitFilters } from '@/hooks/useInitFilters'
import { useSession } from 'next-auth/react'
import { PlanningList } from './PlanningList'
import type { PreprocessedPlanningData } from './preprocessor'

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
  const { data: session } = useSession()
  const user = session?.user.sub

  const columns = useMemo(() =>
    planningListColumns({ sections, authors, user }), [sections, authors, user])

  const columnFilters = useInitFilters<PreprocessedPlanningData>({
    path: 'filters.Plannings.current',
    columns
  })

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<PreprocessedPlanningData>
        columns={columns}
        type={meta.name}
        initialState={{
          grouping: ['newsvalue'],
          columnFilters,
          globalFilter: query.query,
          sorting: [{ id: 'newsvalue', desc: true }, { id: 'title', desc: false }]
        }}
      >
        <TableCommandMenu heading='Plannings'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name='Plannings' title='Planeringar' />
            <Header type='Planning' docType='core/planning-item' />
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
