import * as Y from 'yjs'
import type { Article, Event, Planning } from './index'

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

export function isEvent(data: Planning | Event | Article): data is Event {
  return '_index' in data && data._index.includes('core_event')
}

export function isPlanning(data: Planning | Event | Article): data is Planning {
  if ('_relatedPlannings' in data) {
    return false
  }
  return '_index' in data && data._index.includes('core_planning_item')
}

export function isArticle(data: Planning | Event | Article): data is Article {
  return '_index' in data && data._index.includes('core_article')
}
