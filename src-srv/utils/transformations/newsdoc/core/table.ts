import { Block } from '@ttab/elephant-api/newsdoc'
import { parseTableRows, revertTableRows, type TableRowElement } from './table-rows.js'
import type { TBElement } from '@ttab/textbit'

export const transformTable = (element: Block): TBElement => {
  const { id, data } = element
  const tableBody = data?.tbody || ''
  const rows = parseTableRows(tableBody)

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/table',
    children: rows
  } as TBElement
}

export function revertTable(element: TBElement): Block {
  const { id, children } = element
  const tableChildren = children as TableRowElement[]
  const htmlData = revertTableRows(tableChildren)

  return Block.create({
    id,
    type: 'core/table',
    data: {
      tbody: htmlData
    }
  })
}
