import * as Y from 'yjs'

export function isYMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map
}

export function isYArray(value: unknown): value is Y.Array<unknown> {
  return value instanceof Y.Array
}

export function isYText(value: unknown): value is Y.Text {
  return value instanceof Y.Text
}

export function isYXmlText(value: unknown): value is Y.XmlText {
  return value instanceof Y.XmlText
}

export function isYXmlElement(value: unknown): value is Y.XmlElement {
  return value instanceof Y.XmlElement
}

export function isYXmlFragment(value: unknown): value is Y.XmlFragment {
  return value instanceof Y.XmlFragment
}

export function isYValue(value: unknown): value is Y.XmlText | Y.Text | Y.Array<unknown> | Y.Map<unknown> | Y.XmlElement | Y.XmlFragment {
  return isYArray(value) || isYMap(value) || isYText(value) || isYXmlText(value) || isYXmlElement(value) || isYXmlFragment(value)
}

export function isYContainer(value: unknown): value is Y.Array<unknown> | Y.Map<unknown> {
  return isYArray(value) || isYMap(value)
}
