import {
  Node,
  type Editor,
  type NodeEntry,
  Element,
  Transforms
} from 'slate'
import { TextbitElement } from '@ttab/textbit'

export const normalizeImage = (editor: Editor, nodeEntry: NodeEntry): boolean | undefined => {
  const [, path] = nodeEntry
  const children = Array.from(Node.children(editor, path))

  if (children.length < 4) {
    let hasText = false
    let hasImage = false
    let hasByline = false

    for (const [child] of children) {
      if (!Element.isElement(child)) {
        continue
      }

      // @ts-expect-error Fix needed in Textbit to handle type better
      if (child.type === 'core/image/image') {
        hasImage = true
      }

      // @ts-expect-error Fix needed in Textbit to handle type better
      if (child.type === 'core/image/text') {
        hasText = true
      }
      // @ts-expect-error Fix needed in Textbit to handle type better
      if (child.type === 'core/image/byline') {
        hasByline = true
      }
    }

    if (!hasImage) {
      // If image is gone, delete the whole block
      Transforms.removeNodes(editor, { at: path })
      return true
    } else if (!hasText) {
      // If either text is missing, add empty text node in the right position
      const [addType, atPos] = (!hasByline) ? ['core/image/byline', 2] : ['core/image/text', 1]
      Transforms.insertNodes(
        editor,
        {
          // @ts-expect-error Fix needed in Textbit to handle type better
          id: crypto.randomUUID(),
          class: 'text',
          type: addType,
          children: [{ text: '' }]
        },
        { at: [...path, atPos] }
      )
      return true
    }
  }


  let n = 0
  for (const [child, childPath] of children) {
    if (TextbitElement.isBlock(child) || TextbitElement.isTextblock(child)) {
      // Unwrap block node children (move text element children upwards in tree)
      Transforms.unwrapNodes(editor, {
        at: childPath,
        split: true
      })
      return true
    }

    if (n === 1 && !TextbitElement.isOfType(child, 'core/image/text')) {
      Transforms.setNodes(
        editor,
        // @ts-expect-error Fix needed in Textbit to handle type better
        { type: 'core/image/text' },
        { at: childPath }
      )
      return true
    }

    if (n === 2 && !TextbitElement.isOfType(child, 'core/image/byline')) {
      Transforms.setNodes(
        editor,
        // @ts-expect-error Fix needed in Textbit to handle type better
        { type: 'core/image/byline' },
        { at: childPath }
      )
      return true
    }

    if (n > 2) {
      // Excessive nodes are lifted and transformed to text
      Transforms.setNodes(
        editor,
        // @ts-expect-error Fix needed in Textbit to handle type better
        { type: 'core/text', properties: {} },
        { at: childPath }
      )
      Transforms.liftNodes(
        editor,
        { at: childPath }
      )
      return true
    }
    n++
  }
}
