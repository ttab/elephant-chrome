import { View, ViewHeader } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata, ViewProps } from '@/types/index'
import { useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import { TabsContent } from '@ttab/elephant-ui'
import { ConceptList } from './ConceptList'
import type { SectionConcept } from '@/shared/schemas/conceptSchemas/sectionConcept'
import { sectionConceptColumns } from './SectionConceptColumns'


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


export const Concepts = ({ documentType, title }: ViewProps) => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const columns = useMemo(() =>
    sectionConceptColumns(), [])

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<SectionConcept>
        columns={columns}
        type={meta.name}
      >
        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name={title ?? 'Concepts'} title={title ?? 'Concepts'} />
            <Header type='Concept' />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <ConceptList columns={columns} documentType={documentType ? documentType : ' '} title={title ?? 'Concept title'} />
          </TabsContent>

        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Concepts.meta = meta
