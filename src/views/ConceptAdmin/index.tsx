import { View, ViewHeader } from '@/components/View'
import type { ViewMetadata } from '@/types/index'
import { useState } from 'react'
import { ConceptOverview } from './ConceptOverview'
import { Toolbar } from './components/Toolbar'


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
  const [filter, setFilter] = useState('')

  return (
    <>
      <View.Root tab={currentTab} onTabChange={setCurrentTab}>
        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name='ConceptAdmin' title='Concept Admin' />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>
        <Toolbar filter={filter} setFilter={setFilter} />
        <View.Content>
          <ConceptOverview />
        </View.Content>
      </View.Root>
    </>
  )
}

ConceptAdmin.meta = meta
