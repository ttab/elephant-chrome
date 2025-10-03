import { View } from '@/components/View'
import { TableProvider } from '@/contexts/TableProvider'
import type { ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { planningListColumns } from '../PlanningOverview/PlanningListColumns'
import type { Planning } from '@/shared/schemas/planning'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'


const meta: ViewMetadata = {
  name: 'Concept',
  path: `${import.meta.env.BASE_URL || ''}/concept`,
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


export const Concept = () => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const sections = useSections()
  const authors = useAuthors()

  const columns = useMemo(() =>
    planningListColumns({ sections, authors }), [sections, authors])

  return (
    <View.Root>
      <TableProvider<Planning>
        columns={columns}
        type={meta.name}
      />
    </View.Root>
  )
}

Concept.meta = meta
