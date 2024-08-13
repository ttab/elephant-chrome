import { useContext } from 'react'
import { TableContext } from '@/contexts'
import { type TableProviderState } from '@/contexts/TableProvider'


export function useTable<TData>(): TableProviderState<TData> {
  const context = useContext(TableContext)

  if (context === undefined) { throw new Error('useTable must be used within a TableProvider') }

  return context
}
