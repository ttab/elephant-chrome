import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { useMemo, useState } from 'react'
import { TabsContent } from '@ttab/elephant-ui'
import { ConceptList } from './ConceptList'
import { ConceptColumns } from './ConceptColumns'
import type { IDBConcept } from 'src/datastore/types'
import { Header } from '@/components/Header'
import { useConcepts } from './lib/useConcepts'
import { Error } from '../Error'

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
  const { getType, getData } = useConcepts(title)
  const columns = useMemo(() =>
    ConceptColumns(), [title])
  const type = useMemo(() => getType(), [title])
  const conceptData = useMemo(() => getData(), [title])

  if (!conceptData || !type) {
    return <Error></Error>
  } else {
    return (
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <TableProvider<IDBConcept>
          columns={columns}
          type={meta.name}
        >
          <ViewHeader.Root>
            <ViewHeader.Content>
              <ViewHeader.Title name={title ?? 'Concepts'} title={title ?? 'Concepts'} />
              <Header type={type} />
            </ViewHeader.Content>
            <ViewHeader.Action />
          </ViewHeader.Root>

          <View.Content>
            <TabsContent value='list' className='mt-0'>
              <ConceptList columns={columns} type={type} conceptData={conceptData} />
            </TabsContent>
          </View.Content>
        </TableProvider>
      </View.Root>
    )
  }
}

Concepts.meta = meta
