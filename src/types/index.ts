import { type Block } from '@/protos/service'
import type * as views from '@/views'
import { type LucideIcon } from '@ttab/elephant-ui/icons'

export enum NavigationActionType {
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

interface ViewWidths {
  [key: string]: number // FIXME: Should use some keyof typeof thingy...
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  hd: number
  fhd: number
  qhd: number
  uhd: number
}


export interface ViewMetadata {
  name: ContentState['name']
  path: ContentState['path']
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
  path: string
  props?: ViewProps
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
  id?: string | null
  asCreateDialog?: boolean
  onDialogClose?: (id?: string) => void
  onDocumentCreated?: () => void
  startDate?: string
  className?: string
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

export interface DefaultValueOption {
  payload?: Block
  label: string
  value: string
  icon?: LucideIcon
  iconProps?: {
    size?: number
    fill?: string
    color?: string
    strokeWidth?: number
    className?: string
  }
  color?: string
  info?: string
}
