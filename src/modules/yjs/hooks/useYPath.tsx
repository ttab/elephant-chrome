import type * as Y from 'yjs'
import { getYjsPath } from '../lib/yjs'

type YjsContainer = Y.Map<unknown> | Y.Array<unknown> | Y.Text | Y.XmlText | Y.XmlFragment | Y.XmlElement

export function useYPath(value: YjsContainer | undefined, asString: true): string
export function useYPath(value: YjsContainer | undefined, asString?: false): (string | number)[]
export function useYPath(value: YjsContainer | undefined, asString: boolean): string | (string | number)[]

export function useYPath(value: YjsContainer | undefined, asString: boolean = false): string | (string | number)[] {
  return getYjsPath(value, asString)
}
