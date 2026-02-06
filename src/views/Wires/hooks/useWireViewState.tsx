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

  // Clear a specific filter from a stream (or all filters if type not provided)
  const clearFilter = useCallback((uuid: string, type?: string) => {
    setWireStreams((prev) => {
      // Find the stream to update
      const targetStreamIndex = prev.streams.findIndex((s) => s.uuid === uuid)
      if (targetStreamIndex === -1) {
        console.warn('[useWireViewState] Stream not found:', uuid)
        return prev
      }

      const targetStream = prev.streams[targetStreamIndex]

      // Calculate new filters
      const newFilters = type
        ? targetStream.filters.filter((f) => f.type !== type)
        : []

      // Check if filters actually changed
      const oldFiltersStr = JSON.stringify(targetStream.filters)
      const newFiltersStr = JSON.stringify(newFilters)

      if (oldFiltersStr === newFiltersStr) {
        return prev
      }

      // Create new stream with updated filters
      const newStream = {
        ...targetStream,
        filters: newFilters
      }

      // Create new streams array with only the changed stream replaced
      const newStreamsArray = [...prev.streams]
      newStreamsArray[targetStreamIndex] = newStream

      const newStreams = {
        ...prev,
        streams: newStreamsArray
      }

      onStateChange?.(newStreams.streams)
      return newStreams
    })
  }, [onStateChange])

  // Set a filter on a stream (replaces existing filter of same type)
  const setFilter = useCallback((uuid: string, type: string, values: string[]) => {
    setWireStreams((prev) => {
      // Find the stream to update
      const targetStreamIndex = prev.streams.findIndex((s) => s.uuid === uuid)
      if (targetStreamIndex === -1) {
        console.warn('[useWireViewState] Stream not found:', uuid)
        return prev
      }

      const targetStream = prev.streams[targetStreamIndex]

      // Remove existing filter of this type
      const otherFilters = targetStream.filters.filter((f) => f.type !== type)

      // Create new filters array
      const newFilters = values.length > 0
        ? [...otherFilters, { type, values }]
        : otherFilters

      // Check if filters actually changed
      if (JSON.stringify(targetStream.filters) === JSON.stringify(newFilters)) {
        return prev
      }

      // Create new stream with updated filters
      const newStream = {
        ...targetStream,
        filters: newFilters
      }

      // Create new streams array with only the changed stream replaced
      const newStreamsArray = [...prev.streams]
      newStreamsArray[targetStreamIndex] = newStream

      const newStreams = {
        ...prev,
        streams: newStreamsArray
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
