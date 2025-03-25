import { Block } from '@ttab/elephant-api/newsdoc'

export function textToNewsDoc(text: string): Block[] {
  return (text || '').split('\n').map((line) => {
    return Block.create({
      id: crypto.randomUUID(),
      type: 'core/text',
      data: {
        text: line
      }
    })
  })
}
