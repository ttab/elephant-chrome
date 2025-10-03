import { Commands } from '@/components/Commands'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import type { Factbox } from '@/shared/schemas/factbox'
import { useRegistry } from '@/hooks/useRegistry'
import { factboxColumns } from '../Factboxes/FactboxColumns'
import { Toolbar } from '../Factboxes/Toolbar'
import { ConceptOverview } from './ConceptOverview'


const meta: ViewMetadata = {
  name: 'ConceptAdmin',
  path: `${import.meta.env.BASE_URL}/conceptAdmin`,
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

export const ConceptAdmin = () => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const { locale, timeZone } = useRegistry()

  const columns = useMemo(() =>
    factboxColumns({ locale, timeZone }), [locale, timeZone])
  console.log(columns)

  console.log(columns)

  return (
    <>
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <TableProvider<Factbox> // TODO look into adding Concept to schemas
          columns={columns}
          type={meta.name}
        >

          <TableCommandMenu heading='ConceptAdmin'>
            <Commands />
          </TableCommandMenu>

          <ViewHeader.Root>
            <ViewHeader.Content>
              <ViewHeader.Title name='ConceptAdmin' title='Concept Admin' />
            </ViewHeader.Content>

            <ViewHeader.Action />
          </ViewHeader.Root>

          <Toolbar />
          <View.Content>
            <ConceptOverview />
          </View.Content>
        </TableProvider>

      </View.Root>
    </>
  )
}

ConceptAdmin.meta = meta
