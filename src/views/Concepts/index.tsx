import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import { TabsContent } from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks/useRegistry'
import { PlanningList } from '../PlanningOverview/PlanningList'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'
import { planningListColumns } from '../PlanningOverview/PlanningListColumns'
import { useInitFilters } from '@/hooks/useInitFilters'
import type { Planning } from '@/shared/schemas/planning'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Commands } from '@/components/Commands'
import { ConceptList } from './ConceptList'
import type { Factbox } from '@/shared/schemas/factbox'
import { factboxColumns } from '../Factboxes/FactboxColumns'


const meta: ViewMetadata = {
  name: 'Concepts',
  path: `${import.meta.env.BASE_URL || ''}/concepts`,
  widths: {
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}


export const Concepts = () => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const { locale, timeZone } = useRegistry()

  const columns = useMemo(() =>
    factboxColumns({ locale, timeZone }), [locale, timeZone])


  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Factbox>
        columns={columns}
        type={meta.name}
      >
        <TableCommandMenu heading='Concepts'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name='Concepts' title='Concepts' />
            <Header type='Concept' />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <ConceptList columns={columns} />
          </TabsContent>

        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Concepts.meta = meta
