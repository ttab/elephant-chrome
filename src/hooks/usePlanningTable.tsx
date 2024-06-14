import { useContext } from 'react'
import { PlanningTableContext } from '@/contexts'
import { type TableProviderState } from '@/contexts/PlanningTableProvider'
import { type Planning } from '@/views/Overviews/PlanningOverview/PlanningTable/data/schema'

export const usePlanningTable = (): TableProviderState<Planning> => {
  const context = useContext(PlanningTableContext)

  if (context === undefined) { throw new Error('useTable must be used within a TableProvider') }

  return context
}
