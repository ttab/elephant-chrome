import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { useMemo, useState } from 'react'
import { TabsContent } from '@ttab/elephant-ui'
import { ConceptList } from './ConceptList'
import { ConceptColumns } from './ConceptColumns'
import type { IDBConcept } from 'src/datastore/types'

const meta: ViewMetadata = {
  name: 'Concepts',
  path: `${import.meta.env.BASE_URL || ''}/concepts`,
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


export const Concepts = ({ title }: ViewProps) => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const columns = useMemo(() =>
    ConceptColumns(), [])
  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<IDBConcept>
        columns={columns}
        type={meta.name}
      >
        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name={title ?? 'Concepts'} title={title ?? 'Concepts'} />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <ConceptList columns={columns} title={title ?? 'Concept title'} />
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Concepts.meta = meta
