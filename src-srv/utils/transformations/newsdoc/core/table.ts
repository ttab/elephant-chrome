import { type TBElement } from '@ttab/textbit'
import { type Block } from '@ttab/elephant-api/newsdoc'
import { parseTableBody } from '../../lib/parseTableBody.js'

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
