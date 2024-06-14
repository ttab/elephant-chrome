import { useContext } from 'react'
import { CalendarTableContext } from '@/contexts'
import { type TableProviderState } from '@/contexts/CalendarTableProvider'
import { type Calendar } from '@/views/Overviews/CalendarOverview/CalendarTable/data/schema'

export const useCalendarTable = (): TableProviderState<Calendar> => {
  const context = useContext(CalendarTableContext)

  if (context === undefined) { throw new Error('useTable must be used within a TableProvider') }

  return context
}
