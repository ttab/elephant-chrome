import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { useMemo, useState } from 'react'
import { TabsContent } from '@ttab/elephant-ui'
import { ConceptList } from './ConceptList'
import { ConceptColumns } from './ConceptColumns'
import { Header } from '@/components/Header'
import { tableDataMap, type ConceptTableDataKey } from './lib/conceptDataTable'
import { useInitFilters } from '@/hooks/useInitFilters'
import { useQuery } from '@/hooks/useQuery'
import type { ColumnFiltersState } from '@tanstack/react-table'
import type { Concept } from '@/shared/schemas/conceptSchemas/baseConcept'

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

export const Concepts = ({ documentType }: ViewProps) => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const [query] = useQuery()
  const title = documentType ? tableDataMap[documentType as ConceptTableDataKey]?.label : 'Concepts'
  const columns = useMemo(() =>
    ConceptColumns(), [])
  const columnFilters = useInitFilters<Concept>({
    path: 'filters.concepts.current',
    columns
  })
  // filtering out only the documentStatus filter from the initial filters to avoid filtering by concept title
  const documentStatusFilter: ColumnFiltersState | undefined = useMemo(() => {
    if (!columnFilters) return undefined
    if (columnFilters[1]?.id !== 'documentStatus') return undefined
    return [columnFilters[1]]
  }, [columnFilters])


  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Concept>
        columns={columns}
        type={meta.name}
        initialState={{
          columnFilters: documentStatusFilter,
          globalFilter: query.query
        }}
      >
        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name={title ?? 'Concepts'} title={title ?? 'Concepts'} />
            <Header type='Concept' documentType={documentType} />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <ConceptList columns={columns} documentType={documentType ? documentType : 'default'} />
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Concepts.meta = meta
