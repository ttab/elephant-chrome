import type { TBElement } from '@ttab/textbit'
import { parse } from 'node-html-parser'
import { Element, Node } from 'slate'

export interface TableRowElement {
  type: 'core/table/row'
  class: 'block'
  children: [{
    type: 'core/table/row/cell'
    class: 'text'
    children: [{ text: string }]
  }]
}

export function parseTableRows(tablebody: string) {
  const root = parse(tablebody)
  const rows = root.querySelectorAll('tr')

  return rows.map((row) => {
    const cells = row.children
    return {
      type: 'core/table/row',
      class: 'block',
      children: cells.map((cell) => {
        const element: TBElement = {
          type: 'core/table/row/cell',
          class: 'text',
          children: [{ text: cell.textContent.trim() }]
        }

        const colspan = cell.getAttribute('colspan')
        const rowspan = cell.getAttribute('rowspan')

        if (colspan || rowspan) {
          element.properties = {
            ...(colspan ? { colspan } : {}),
            ...(rowspan ? { rowspan } : {})
          }
        }

        return element
      })
    }
  })
}

export function revertTableRows(data: TBElement[]) {
  return data.filter((d) => d.type === 'core/table/row')
    .map((d) => {
      const cells = d.children
        .map((cell) => {
          if (!Element.isElement(cell)) {
            return '<td></td>'
          }

          const props = cell.properties
          const attribs = [
            props?.colspan ? `colspan="${props.colspan}"` : '',
            props?.rowspan ? `rowspan="${props.rowspan}"` : ''
          ].filter(Boolean).join(' ')

          return `<td${attribs ? ' ' + attribs : ''}>${Node.string(cell)}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
}
