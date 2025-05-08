import * as Y from 'yjs'

export function isYMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map
}

export function isYArray(value: unknown): value is Y.Array<unknown> {
  return value instanceof Y.Array
}

export function isYXmlText(value: unknown): value is Y.XmlText {
  return value instanceof Y.XmlText
}

export function isYContainer(value: unknown): value is Y.Array<unknown> | Y.Map<unknown> {
  return isYArray(value) || isYMap(value)
}

export function isNumber(value: unknown): value is number {
  return Number.isInteger(value)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && value.constructor === Object
}
