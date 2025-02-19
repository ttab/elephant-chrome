import { type Block } from '@ttab/elephant-api/newsdoc'
import type * as views from '@/views'
import { type RpcError } from '@protobuf-ts/runtime-rpc'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import type { TemplatePayload } from '@/defaults/templates'

export enum NavigationActionType {
  SET = 'set',
  FOCUS = 'focus',
  ACTIVE = 'active',
  ON_DOC_CREATED = 'onDocumentCreated'
}

export type View = keyof typeof views

export interface NavigationAction {
  type: NavigationActionType
  props?: ViewProps
  content?: ContentState[]
  viewId?: string
  active?: string
  callback?: (() => void) | undefined
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
  focus: string | null
  active: string | undefined
  content: ContentState[]
}

export interface ContentState {
  viewId: string
  name: View
  path: string
  props?: ViewProps
}

export interface ViewProps {
  id?: string | null
  asDialog?: boolean
  onDialogClose?: (id?: string, title?: string) => void
  onDocumentCreated?: () => void
  from?: string
  source?: string
  className?: string
  payload?: TemplatePayload
  autoFocus?: boolean
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


export type ElephantValidationMessage = Pick<RpcError, 'code' | 'methodName' | 'serviceName' | 'meta'>

export type ValidateStateRef = React.MutableRefObject<ValidateState>

export type ValidateState = Record<string, {
  label: string
  valid: boolean
  reason: string
}>
