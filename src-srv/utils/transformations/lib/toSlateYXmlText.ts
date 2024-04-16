import * as Y from 'yjs'
import { textToNewsDoc } from './textToNewsdoc.js'
import { newsDocToSlate } from '../newsdoc/index.js'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

export function toSlateYXmlText(text: string): Y.XmlText {
  const newsDocText = textToNewsDoc(text)
  const slateText = newsDocToSlate(newsDocText || [])

  const yXmlText = new Y.XmlText()
  yXmlText.applyDelta(slateNodesToInsertDelta(slateText))

  return yXmlText
}

