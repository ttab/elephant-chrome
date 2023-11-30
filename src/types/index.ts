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

export interface ViewMetadata {
  name: string
  path: string
  widths: {
    sm: [number] | [number, number]
    md: [number] | [number, number]
    lg: [number] | [number, number]
    xl: [number] | [number, number]
    '2xl': [number] | [number, number]
  }
}

export interface ViewRegistryItem {
  meta: ViewMetadata
  component: React.FC<ViewProps>
}

export interface ViewRegistry {
  get: (key: View) => ViewRegistryItem
  set: () => void
}

export interface NavigationState {
  viewRegistry: ViewRegistry
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
