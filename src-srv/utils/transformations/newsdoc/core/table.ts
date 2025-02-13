import { type Element } from 'slate'
import { Block } from '@ttab/elephant-api/newsdoc'
import { parseTableRows, revertTableRows, type TableRowElement } from './table-rows.js'

export const transformTable = (element: Block): Element => {
  const { id, data } = element
  const tableBody = data?.tbody || ''
  const rows = parseTableRows(tableBody)

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/table',
    children: rows
  }
}

export function revertTable(element: Element): Block {
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
