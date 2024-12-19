import { type TBElement } from '@ttab/textbit'
import { Block } from '@ttab/elephant-api/newsdoc'
import { parseTableBody, parseTableRows, type TableChild } from '../../lib/parseTableData.js'

export const transformTable = (element: Block): TBElement => {
  const { id, data } = element
  const tableBody = data?.tbody || ''
  const rows = parseTableBody(tableBody)

  return {
    id: id || crypto.randomUUID(),
    class: 'block',
    type: 'core/table',
    children: rows
  }
}

export function revertTable(element: TBElement): Block {
  const { id, children } = element
  const tableChildren = children as TableChild[]
  const htmlData = parseTableRows(tableChildren)

  return Block.create({
    id,
    type: 'core/table',
    data: {
      tbody: htmlData
    }
  })
}
