import { parse } from 'node-html-parser'

export interface TableChild {
  type: 'core/table/row'
  class: 'block'
  children: [{
    type: 'core/table/row/cell'
    class: 'text'
    children: [{ text: string }]
  }]
}

export function parseTableBody(tablebody: string) {
  const root = parse(tablebody)
  const rows = root.querySelectorAll('tr')

  const result = rows.map((row) => {
    const cells = row.childNodes
    return {
      type: 'core/table/row',
      class: 'block',
      children: cells.map((cell) => {
        return {
          type: 'core/table/row/cell',
          class: 'text',
          children: cell.textContent.trim().length > 0
            ? [{ text: cell.textContent.trim() }]
            : [{ text: '' }]
        }
      }
      )
    }
  })

  return result
}

export function parseTableRows(data: TableChild[]) {
  return data.filter((d: TableChild) => d.type === 'core/table/row')
    .map((d: TableChild) => {
      const cells = d.children
        .map((cell) => {
          const textContent = cell.children
            .map((child: { text: string }) => child.text)
            .join('')
          return `<td>${textContent}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
}
