import type { FC } from 'react'
import type { InjectionPointEntry, InjectionPointRendererProps } from './types'

class InjectionPointRegistry {
  private entries = new Map<string, Map<string, InjectionPointEntry>>()
  private listeners = new Set<() => void>()
  private version = 0

  register = (
    pointId: string,
    rendererId: string,
    renderer: FC<InjectionPointRendererProps>
  ): (() => void) => {
    let pointMap = this.entries.get(pointId)

    if (!pointMap) {
      pointMap = new Map()
      this.entries.set(pointId, pointMap)
    }

    pointMap.set(rendererId, { pointId, rendererId, renderer })
    this.version++
    this.notifyListeners()

    return () => {
      const map = this.entries.get(pointId)

      if (map) {
        map.delete(rendererId)

        if (map.size === 0) {
          this.entries.delete(pointId)
        }
      }

      this.version++
      this.notifyListeners()
    }
  }

  getRenderers = (pointId: string): InjectionPointEntry[] => {
    const map = this.entries.get(pointId)

    if (!map) {
      return []
    }

    return Array.from(map.values())
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  getVersion = (): number => {
    return this.version
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const injectionPointRegistry = new InjectionPointRegistry()
