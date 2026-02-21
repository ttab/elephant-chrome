import type * as Y from 'yjs'
import type { FC, PropsWithChildren, Dispatch, SetStateAction, ReactNode, FocusEventHandler, MouseEvent as ReactMouseEvent } from 'react'

// --- Plugin registration ---

export interface PluginInstance {
  activate: (context: PluginContext) => (() => void) | void
}

export interface PluginContext {
  documentActivity: {
    register: (docType: string, activityId: string, definition: ActivityDefinition) => (() => void)
  }
  viewRegistry: {
    register: (name: string, item: ViewRegistryItem) => (() => void)
  }
}

export declare function registerPlugin(plugin: PluginInstance): void

/** The application's base URL path (e.g. '/elephant') */
export declare const BASE_URL: string

// --- Activity types ---

export interface ExecuteOptions {
  target?: 'self' | 'blank' | 'last'
  keepFocus?: boolean
}

export declare function resolveEventOptions(
  event: ReactMouseEvent<Element> | KeyboardEvent
): ExecuteOptions | null

export interface ResolvedRoute {
  viewName: string
  props: ViewProps
  target?: 'self' | 'blank' | 'last'
}

export type ViewRouteFunc = (
  docId: string,
  args?: Record<string, unknown>
) => Promise<ResolvedRoute>

export interface ActivityDefinition {
  title: string
  viewRouteFunc: ViewRouteFunc
}

// --- View types ---

export interface ViewProps {
  id?: string | null
  planningId?: string | null
  version?: string
  asDialog?: boolean
  onDialogClose?: (id?: string, title?: string) => void
  onDocumentCreated?: () => void
  from?: string
  source?: string
  className?: string
  autoFocus?: boolean
  preview?: boolean
}

interface ViewWidths {
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
  name: string
  path: string
  widths: ViewWidths
}

export interface ViewRegistryItem {
  meta: ViewMetadata
  component: FC<ViewProps>
}

// --- Yjs document hook ---

export interface YDocument<T> {
  id: string
  ele: T
  ctx: Y.Map<unknown>
  connected: boolean
  synced: boolean
  online: boolean
  visibility: boolean
  isInProgress: boolean
  setIsInProgress: (isInProgress: boolean) => void
  isChanged: boolean
  setIsChanged: (isChanged: boolean) => void
}

export declare function useYDocument<T>(
  id: string,
  options?: {
    skipIndexedDB?: boolean
    visibility?: boolean
    rootMap?: string
  }
): YDocument<T>

export declare function useYValue<T>(
  yContainer: Y.Map<unknown> | Y.Array<unknown> | undefined,
  relativePath: string | [string, ...(string | number)[]],
  raw?: boolean
): [T | undefined, (newValue: T) => void]

// --- Form components ---

export declare const TextBox: FC<{
  ydoc: YDocument<Y.Map<unknown>>
  value: Y.XmlText | undefined
  disabled?: boolean
  icon?: ReactNode
  placeholder?: string
  className?: string
  singleLine?: boolean
  autoFocus?: boolean
  countCharacters?: boolean
  spellcheck?: boolean
  onBlur?: FocusEventHandler<HTMLDivElement>
  onFocus?: FocusEventHandler<HTMLDivElement>
  onChange?: (arg: unknown[]) => void
}>

export declare const Form: {
  Root: FC<PropsWithChildren & { asDialog?: boolean, className?: string }>
  Content: FC<PropsWithChildren>
  Title: FC<PropsWithChildren>
  Group: FC<PropsWithChildren & { icon?: FC<{ size?: number, strokeWidth?: number, color?: string, className?: string }> }>
  Footer: FC<PropsWithChildren & { className?: string }>
  Submit: FC<PropsWithChildren & {
    onSubmit?: () => void | Promise<void>
    onSecondarySubmit?: () => void | Promise<void>
    onTertiarySubmit?: () => void | Promise<void>
    disableOnSubmit?: boolean
  }>
  Table: FC<PropsWithChildren & { className?: string }>
}

// --- View chrome components ---

interface ViewHeaderRootProps extends PropsWithChildren {
  className?: string
  asDialog?: boolean
}

interface ViewHeaderTitleProps extends PropsWithChildren {
  name: string
  title: string
  short?: string
  icon?: FC<{ size?: number, strokeWidth?: number, color?: string, className?: string }>
  iconColor?: string
  asDialog?: boolean
  ydoc?: YDocument<Y.Map<unknown>>
  preview?: boolean
}

interface ViewHeaderContentProps extends PropsWithChildren {
  className?: string
}

interface ViewHeaderActionProps extends PropsWithChildren {
  ydoc?: YDocument<Y.Map<unknown>>
  onDialogClose?: () => void
  asDialog?: boolean
}

interface ViewHeaderRemoteUsersProps {
  ydoc: YDocument<Y.Map<unknown>>
}

export declare const ViewHeader: {
  Root: FC<ViewHeaderRootProps>
  Title: FC<ViewHeaderTitleProps>
  Content: FC<ViewHeaderContentProps>
  Action: FC<ViewHeaderActionProps>
  RemoteUsers: FC<ViewHeaderRemoteUsersProps>
}

interface ViewRootProps extends PropsWithChildren {
  className?: string
  asDialog?: boolean
  tab?: string
  onTabChange?: Dispatch<SetStateAction<string>>
}

interface ViewContentProps extends PropsWithChildren {
  className?: string
  variant?: 'default' | 'grid' | 'no-scroll'
  columns?: number
}

export declare const View: {
  Root: FC<ViewRootProps>
  Content: FC<ViewContentProps>
}
