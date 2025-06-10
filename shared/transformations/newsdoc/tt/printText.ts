import { Block } from '@ttab/elephant-api/newsdoc'
import type { TBElement } from '@ttab/textbit'

interface PrintChild {
  text?: string
}

export function transformPrintText(element: Block): TBElement {
  const { id, data } = element
  const children = [
    {
      id: id || crypto.randomUUID(),
      class: 'text',
      type: 'tt/print-text/text',
      children: [{ text: data.text }]
    },
    {
      id: id || crypto.randomUUID(),
      class: 'text',
      type: 'tt/print-text/role',
      children: [{ text: element.role }]
    }
  ]

  return {
    id: element.id || crypto.randomUUID(), // Must have id, if id is missing positioning in drag'n drop does not work
    type: element.type,
    properties: element.role ? { role: element.role } : {},
    class: 'text',
    children
  }
}

export function revertPrintText(element: TBElement): Block {
  const printTextNode = element.children.find((child) => child.type === 'tt/print-text/text')
  const printText = (printTextNode?.children as PrintChild[] | undefined)?.[0]?.text ?? ''
  const printRoleNode = element.children.find((child) => child.type === 'tt/print-text/role')
  const printRole = (printRoleNode?.children as PrintChild[] | undefined)?.[0]?.text ?? ''

  return Block.create({
    id: element.id,
    type: 'tt/print-text',
    role: printRole,
    data: { text: printText }
  })
}
