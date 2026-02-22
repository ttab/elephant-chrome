import type { JSX, ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { injectionPointRegistry } from './registry'
import type { YDocument } from '@/modules/yjs/hooks/useYDocument'
import type * as Y from 'yjs'

export interface InjectionPointProps {
  id: string
  ydoc?: YDocument<Y.Map<unknown>>
  data?: Record<string, unknown>
  className?: string
  children?: ReactNode
}

export const InjectionPoint = ({ id, ydoc, data, className, children }: InjectionPointProps): JSX.Element | null => {
  useSyncExternalStore(
    injectionPointRegistry.subscribe,
    injectionPointRegistry.getVersion
  )

  const renderers = injectionPointRegistry.getRenderers(id)

  if (renderers.length === 0) {
    if (className) {
      return <div className={className}>{children}</div>
    }

    return <>{children}</>
  }

  // Compose renderers by nesting: each wraps the previous output
  let result: ReactNode = children ?? null

  for (const entry of renderers) {
    const Renderer = entry.renderer
    result = <Renderer ydoc={ydoc} data={data}>{result}</Renderer>
  }

  if (className) {
    return <div className={className}>{result}</div>
  }

  return <>{result}</>
}
