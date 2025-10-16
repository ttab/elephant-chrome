import { View, ViewHeader } from '@/components/View'
import type { ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { ConceptOverview } from './ConceptOverview'
import { TableProvider } from '@/contexts/TableProvider'
import { ConceptColumns } from '../Concepts/ConceptColumns'
import type { IDBConcept } from 'src/datastore/types'


const meta: ViewMetadata = {
  name: 'Admin',
  path: `${import.meta.env.BASE_URL}/admin`,
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

export const Admin = () => {
  const [currentTab, setCurrentTab] = useState<string>('list')

  const columns = useMemo(() =>
    ConceptColumns(), [])

  return (
    <>
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <TableProvider<IDBConcept>
          columns={columns}
          type={meta.name}
        >
          <ViewHeader.Root>
            <ViewHeader.Content>
              <ViewHeader.Title name='Admin' title='Admin' />
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

Admin.meta = meta
