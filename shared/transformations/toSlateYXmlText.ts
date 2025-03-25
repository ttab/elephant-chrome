import * as Y from 'yjs'
import { textToNewsDoc } from './textToNewsdoc'
import { newsDocToSlate } from './newsdoc/index'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

export function toSlateYXmlText(text: string): Y.XmlText {
  const newsDocText = textToNewsDoc(text)
  const slateText = newsDocToSlate(newsDocText || [])

  const yXmlText = new Y.XmlText()
  const delta = slateNodesToInsertDelta(slateText)
  yXmlText.applyDelta(delta)

  return yXmlText
}

