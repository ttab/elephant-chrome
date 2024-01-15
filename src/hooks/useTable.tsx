import { useContext } from 'react'
import { TableContext } from '@/contexts'
import { type TableProviderState } from '@/contexts/TableProvider'
import { type Planning } from '@/views/PlanningOverview/PlanningTable/data/schema'

export const useTable = (): TableProviderState<Planning> => {
  const context = useContext(TableContext)

  if (context === undefined) { throw new Error('useTable must be used within a TableProvider') }

  return context
}
