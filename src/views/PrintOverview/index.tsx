
import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader, View } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { PlanningList } from './PlanningList'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { planningListColumns } from './PlanningListColumns'
import { type PlanningSearchParams, type Planning as PlanningType, Plannings as PlanningsIndex } from '@/lib/index'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'
import { Commands } from '@/components/Commands'
import { SWRProvider } from '@/contexts/SWRProvider'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'
import { useQuery } from '@/hooks/useQuery'
import { loadFilters } from '@/lib/loadFilters'

const meta: ViewMetadata = {
  name: 'Print',
  path: `${import.meta.env.BASE_URL}/print`,
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

export const Print = (): JSX.Element => {

  const [currentTab, setCurrentTab] = useState<string>('list')

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <ViewHeader.Root>
        <ViewHeader.Title name='Print' title='Print' />
        <ViewHeader.Content>
          <Header type='Print' />
            </ViewHeader.Content>
            <ViewHeader.Action />
      </ViewHeader.Root>
      <View.Content>
        <h1 className='text-2xl font-bold p-4 text-center'>Print</h1>
      </View.Content>
    </View.Root>
  )
}

Print.meta = meta
