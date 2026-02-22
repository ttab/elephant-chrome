import type { FC, ReactNode } from 'react'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import type * as Y from 'yjs'

export interface InjectionPointRendererProps {
  ydoc?: YDocument<Y.Map<unknown>>
  data?: Record<string, unknown>
  children?: ReactNode
}

export interface InjectionPointEntry {
  pointId: string
  rendererId: string
  renderer: FC<InjectionPointRendererProps>
}
