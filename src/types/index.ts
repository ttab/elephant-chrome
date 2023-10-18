export enum NavigationActionType {
  ADD = 'add',
  REMOVE = 'remove',
  SET = 'setContent'
}

export interface NavigationAction {
  type: NavigationActionType
  content?: ContentState[]
  props?: Record<string, unknown>
  component?: JSX.Element
  [key: string]: unknown
}

export interface ContentState {
  id: string
  name: string
  props: Record<string, unknown>
}

export interface HistoryState {
  id: string
  itemName: string
  props: Record<string, unknown>
  contentState: ContentState[]
}
