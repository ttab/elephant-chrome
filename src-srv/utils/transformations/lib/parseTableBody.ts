import { parse } from 'node-html-parser'

export function parseTableBody(tablebody: string) {
  const root = parse(tablebody)
  const rows = root.querySelectorAll('tr')

  const result = rows.map((row) => {
    const cells = row.childNodes
    return {
      type: 'core/table/row',
      class: 'block',
      children: cells.filter((cell) => {
        return cell.textContent.trim().length > 0
      }).map((cell) => {
        return {
          type: 'core/table/row/cell',
          class: 'text',
          children: [{ text: cell.textContent }]
        }
      }
      )
    }
  })

  return result
}
