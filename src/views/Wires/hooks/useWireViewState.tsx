import { useState, useCallback } from 'react'

// Storage format (external)
export interface ViewFilter {
  role: string
  type: string
  value: string
}

export interface ViewDataset {
  uuid: string
  title?: string
  meta: ViewFilter[]
}

export interface UserViewState {
  title?: string
  type: string
  content: ViewDataset[]
}

// Internal format (simpler to work with)
export interface WireFilter {
  type: string
  values: string[]
}

export interface WireStream {
  uuid: string
  title?: string
  filters: WireFilter[]
}

export interface WireStreams {
  title?: string
  streams: WireStream[]
}


export function useWireViewState(
  initialState?: UserViewState,
  onStateChange?: (streams: WireStream[]) => void
) {
  const [wireStreams, setWireStreams] = useState<WireStreams>(() =>
    fromUserViewState(initialState)
  )

  // Add a new stream
  const addStream = useCallback(() => {
    setWireStreams((prev) => {
      const newStreams = {
        ...prev,
        streams: [
          ...prev.streams,
          {
            uuid: crypto.randomUUID(),
            filters: []
          }
        ]
      }
      onStateChange?.(newStreams.streams)
      return newStreams
    })
  }, [onStateChange])

  // Remove a stream by UUID
  const removeStream = useCallback((uuid: string) => {
    setWireStreams((prev) => {
      const newStreams = {
        ...prev,
        streams: prev.streams.filter((stream) => stream.uuid !== uuid)
      }
      onStateChange?.(newStreams.streams)
      return newStreams
    })
  }, [onStateChange])

  // Clear all filters from a stream
  const clearFilter = useCallback((uuid: string) => {
    setWireStreams((prev) => {
      const newStreams = {
        ...prev,
        streams: prev.streams.map((stream) =>
          stream.uuid === uuid
            ? { ...stream, filters: [] }
            : stream
        )
      }
      onStateChange?.(newStreams.streams)
      return newStreams
    })
  }, [onStateChange])

  // Set a filter on a stream (replaces existing filter of same type)
  const setFilter = useCallback((uuid: string, type: string, values: string[]) => {
    setWireStreams((prev) => {
      const newStreams = {
        ...prev,
        streams: prev.streams.map((stream) => {
          if (stream.uuid !== uuid) return stream

          // Remove existing filter of this type, then add new one
          const otherFilters = stream.filters.filter((f) => f.type !== type)

          return {
            ...stream,
            filters: values.length > 0
              ? [...otherFilters, { type, values }]
              : otherFilters
          }
        })
      }
      onStateChange?.(newStreams.streams)
      return newStreams
    })
  }, [onStateChange])

  // Get the full wire state in storage format
  const getWireState = useCallback((): UserViewState => {
    return toUserViewState(wireStreams)
  }, [wireStreams])

  return {
    streams: wireStreams.streams,
    addStream,
    removeStream,
    clearFilter,
    setFilter,
    getWireState
  }
}

/**
 * Convert external storage format to internal working format
 */
function fromUserViewState(state?: UserViewState): WireStreams {
  if (!state) {
    return { streams: [] }
  }

  const streams: WireStream[] = state.content.map((dataset) => {
    // Group filters by type
    const filterMap = new Map<string, string[]>()

    dataset.meta.forEach((filter) => {
      if (filter.role !== 'filter') return

      const existing = filterMap.get(filter.type) || []
      existing.push(filter.value)
      filterMap.set(filter.type, existing)
    })

    const filters: WireFilter[] = Array.from(filterMap.entries()).map(([type, value]) => ({
      type,
      values: value
    }))

    return {
      uuid: dataset.uuid,
      title: dataset.title,
      filters
    }
  })

  return {
    title: state.title,
    streams
  }
}

/**
 * Convert internal working format to external storage format
 */
function toUserViewState(wireStreams: WireStreams): UserViewState {
  const content: ViewDataset[] = wireStreams.streams.map((stream) => {
    const meta: ViewFilter[] = []

    stream.filters.forEach((filter) => {
      filter.values.forEach((value) => {
        meta.push({
          role: 'filter',
          type: filter.type,
          value
        })
      })
    })

    return {
      uuid: stream.uuid,
      title: stream.title,
      meta
    }
  })

  return {
    title: wireStreams.title,
    type: 'tt/wires-panes',
    content
  }
}
