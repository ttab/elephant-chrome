import type * as views from '@/views'
import { type JWTPayload } from 'jose'

export enum NavigationActionType {
  ADD = 'add',
  REMOVE = 'remove',
  SET = 'set',
  FOCUS = 'focus',
  ACTIVE = 'active'
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
  focus: string | null
  active: string | undefined
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
  path: string
  type: 'popstate' | 'pushstate' | 'replacestate'
  contentState: ContentState[]
}

export interface ViewProps {
  id?: string
  documentId?: string
}

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export interface JWT extends JWTPayload {
  sub: string
  sub_name: string
  scope: string
  units: string[]
  access_token: string
}
