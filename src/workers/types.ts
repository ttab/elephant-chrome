import type { EventlogItem } from '@ttab/elephant-api/repository'

export interface SWConnectMessage {
  type: 'connect'
  payload: {
    url: string
    accessToken?: string
  }
}

export interface SWVersionMessage {
  type: 'version'
  payload: number
}

export interface SWShutdownMessage {
  type: 'shutdown'
  payload: void
}

export interface SWDebugMessage {
  type: 'debug'
  payload: string
}

export interface SWSSEMessage {
  type: 'sse'
  payload: EventlogItem
}

export type SWMessage = SWConnectMessage
  | SWVersionMessage
  | SWDebugMessage
  | SWSSEMessage
  | SWShutdownMessage

export interface SWPostMessageEvent extends MessageEvent {
  data: SWMessage
}
