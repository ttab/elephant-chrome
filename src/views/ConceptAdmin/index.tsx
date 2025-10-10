import { View, ViewHeader } from '@/components/View'
import type { ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { ConceptOverview } from './ConceptOverview'
import { TableProvider } from '@/contexts/TableProvider'
import type { Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
import { ConceptColumns } from '../Concepts/ConceptColumns'


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

  const columns = useMemo(() =>
    ConceptColumns(), [])

  return (
    <>
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <TableProvider<Concept>
          columns={columns}
          type={meta.name}
        >
          <ViewHeader.Root>
            <ViewHeader.Content>
              <ViewHeader.Title name='ConceptAdmin' title='Admin' />
            </ViewHeader.Content>
            <ViewHeader.Action />
          </ViewHeader.Root>
          <View.Content>
            <ConceptOverview />
          </View.Content>
        </TableProvider>
      </View.Root>
    </>
  )
}

ConceptAdmin.meta = meta
