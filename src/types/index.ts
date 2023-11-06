import type * as views from '@/views'

export enum NavigationActionType {
  ADD = 'add',
  REMOVE = 'remove',
  SET = 'setContent'
}

export type View = keyof typeof views

export interface NavigationAction {
  type: NavigationActionType
  props?: ViewProps
  name?: string
  component?: React.FC<ViewProps>
  content?: ContentState[]
  id?: string
}

export interface RegistryItem {
  metadata: {
    name: string
    path: string
  }
  component: React.FC<ViewProps>
}

export interface Registry {
  get: (key: View) => RegistryItem
  set: () => void
}

export interface NavigationState {
  registry: Registry
  content: JSX.Element[]
}

export interface ContentState {
  id: string
  name: View
  props: ViewProps
}

export interface HistoryState {
  id: string
  itemName: string
  props: Record<string, unknown>
  contentState: ContentState[]
}

export interface ViewProps {
  id: string
  name: string
  index?: number
}

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}
