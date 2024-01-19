import type * as views from '@/views'
import { LucideIcon } from '@ttab/elephant-ui/icons'
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
  viewId?: string
  active?: string
}

export interface ViewWidths {
  [key: string]: number // FIXME: Should use some keyof typeof thingy...
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}


export interface ViewMetadata {
  name: string
  path: string
  widths: ViewWidths
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
  views: Array<{ name: string, colSpan: number }>
  focus: string | null
  active: string | undefined
  content: JSX.Element[]
}

export interface ContentState {
  viewId: string
  name: View
  props: ViewProps
}

export interface HistoryState {
  viewId: string
  viewName: string
  props: Record<string, unknown>
  path: string
  type: 'popstate' | 'pushstate' | 'replacestate'
  contentState: ContentState[]
}

export interface ViewProps {
  id?: string
}

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export interface ViewProviderState {
  viewId: string
  name: string
  isActive: boolean
  isFocused: boolean
  isHidden: boolean
}

export interface JWT extends JWTPayload {
  sub: string
  sub_name: string
  scope: string
  units: string[]
  access_token: string
}

export interface ColumnValueOption {
  label: string
  value: string
  icon?: LucideIcon,
  color?: string
}
