import type { EventlogItem } from '@ttab/elephant-api/repository'

export interface SWConnectMessage {
  type: 'connect'
  payload: {
    url: string
    accessToken?: string
  }
}

export interface SWConnectedMessage {
  type: 'connected'
  payload: number
}

export interface SWShutdownMessage {
  type: 'shutdown'
  payload: void
}

export interface SWReloadMessage {
  type: 'reload'
  payload: number
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
  | SWConnectedMessage
  | SWDebugMessage
  | SWSSEMessage
  | SWShutdownMessage
  | SWReloadMessage

export interface SWPostMessageEvent extends MessageEvent {
  data: SWMessage
}
