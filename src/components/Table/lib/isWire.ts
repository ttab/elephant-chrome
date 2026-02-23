import type { Wire } from '@/shared/schemas/wire'
import type { TableRowData } from '../types'

/**
 * Type guard to check if a row is a WireType based on the presence of
 * 'document.meta.tt_wire.role' in fields.
 *
 * Can be removed once Wire refinement is done.
 */
export function isWire<TData extends TableRowData>(original: TData): original is TData & Wire {
  const fields = (original as Record<string, unknown>).fields
  return typeof fields === 'object' && fields !== null && 'document.meta.tt_wire.role' in fields
}
