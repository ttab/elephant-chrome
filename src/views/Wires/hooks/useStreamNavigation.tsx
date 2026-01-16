// hooks/useStreamNavigation.ts
import { useEffect, useRef, useCallback } from 'react'

interface UseStreamNavigationProps {
  isActive?: boolean
  containerRef: React.RefObject<HTMLElement | null>
  wrapNavigation?: boolean
}

export function useStreamNavigation({
  isActive = true,
  containerRef,
  wrapNavigation = false
}: UseStreamNavigationProps) {
  const lastFocusedId = useRef<string | null>(null)
  const isNavigating = useRef(false)

  // Find all streams (columns)
  const getStreams = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []

    // Get all stream wrappers
    const streams = containerRef.current.querySelectorAll<HTMLElement>(
      '[data-stream-id]'
    )
    return Array.from(streams)
  }, [containerRef])

  // Get all items in a specific stream
  const getStreamItems = useCallback((stream: HTMLElement): HTMLElement[] => {
    const items = stream.querySelectorAll<HTMLElement>('[data-item-id]')
    return Array.from(items)
  }, [])

  // Find item element by ID across all streams
  const findItemElement = useCallback((itemId: string): HTMLElement | null => {
    if (!containerRef.current) return null
    return containerRef.current.querySelector<HTMLElement>(
      `[data-item-id="${itemId}"]`
    )
  }, [containerRef])

  // Focus an item by ID
  const focusItem = useCallback((itemId: string) => {
    const element = findItemElement(itemId)
    if (element) {
      element.focus()
      lastFocusedId.current = itemId

      // Scroll item into view if needed
      element.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [findItemElement])

  // Get current focused item ID
  const getCurrentFocusedId = useCallback((): string | null => {
    if (!containerRef.current) return null

    const activeElement = document.activeElement
    if (!activeElement || !containerRef.current.contains(activeElement)) {
      return lastFocusedId.current
    }

    const itemElement = activeElement.closest('[data-item-id]')
    if (itemElement) {
      return itemElement.getAttribute('data-item-id')
    }

    return lastFocusedId.current
  }, [containerRef])

  // Find which stream and index an item is in
  const findItemPosition = useCallback((itemId: string): {
    streamIndex: number
    itemIndex: number
    stream: HTMLElement
  } | null => {
    const streams = getStreams()

    for (let streamIndex = 0; streamIndex < streams.length; streamIndex++) {
      const stream = streams[streamIndex]
      const items = getStreamItems(stream)
      const itemIndex = items.findIndex(
        (item) => item.getAttribute('data-item-id') === itemId
      )

      if (itemIndex !== -1) {
        return { streamIndex, itemIndex, stream }
      }
    }

    return null
  }, [getStreams, getStreamItems])

  // Navigate between items
  const handleNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isActive) return

    isNavigating.current = true

    const currentId = getCurrentFocusedId()
    const streams = getStreams()

    if (!streams.length) {
      isNavigating.current = false
      return
    }

    // If nothing focused, focus first item in first stream
    if (!currentId) {
      const firstStream = streams[0]
      const items = getStreamItems(firstStream)
      if (items.length > 0) {
        const firstId = items[0].getAttribute('data-item-id')
        if (firstId) focusItem(firstId)
      }
      isNavigating.current = false
      return
    }

    const position = findItemPosition(currentId)
    if (!position) {
      isNavigating.current = false
      return
    }

    const { streamIndex, itemIndex } = position
    let nextStreamIndex = streamIndex
    let nextItemIndex = itemIndex

    switch (direction) {
      case 'up':
        nextItemIndex = itemIndex - 1
        if (wrapNavigation && nextItemIndex < 0) {
          const items = getStreamItems(streams[streamIndex])
          nextItemIndex = items.length - 1
        } else if (nextItemIndex < 0) {
          isNavigating.current = false
          return
        }
        break

      case 'down': {
        nextItemIndex = itemIndex + 1
        const currentStreamItems = getStreamItems(streams[streamIndex])
        if (wrapNavigation && nextItemIndex >= currentStreamItems.length) {
          nextItemIndex = 0
        } else if (nextItemIndex >= currentStreamItems.length) {
          isNavigating.current = false
          return
        }
        break
      }

      case 'left': {
        nextStreamIndex = streamIndex - 1
        if (wrapNavigation && nextStreamIndex < 0) {
          nextStreamIndex = streams.length - 1
        } else if (nextStreamIndex < 0) {
          isNavigating.current = false
          return
        }
        // Try to maintain same item index, or use last item if shorter
        const prevStreamItems = getStreamItems(streams[nextStreamIndex])
        nextItemIndex = Math.min(itemIndex, prevStreamItems.length - 1)
        break
      }

      case 'right': {
        nextStreamIndex = streamIndex + 1
        if (wrapNavigation && nextStreamIndex >= streams.length) {
          nextStreamIndex = 0
        } else if (nextStreamIndex >= streams.length) {
          isNavigating.current = false
          return
        }
        // Try to maintain same item index, or use last item if shorter
        const nextStreamItems = getStreamItems(streams[nextStreamIndex])
        nextItemIndex = Math.min(itemIndex, nextStreamItems.length - 1)
        break
      }
    }

    const targetStream = streams[nextStreamIndex]
    const targetItems = getStreamItems(targetStream)

    if (targetItems[nextItemIndex]) {
      const nextId = targetItems[nextItemIndex].getAttribute('data-item-id')
      if (nextId) focusItem(nextId)
    }

    setTimeout(() => {
      isNavigating.current = false
    }, 100)
  }, [isActive, getCurrentFocusedId, getStreams, getStreamItems, findItemPosition, focusItem, wrapNavigation])

  // Keyboard event handler
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return

      const focusInCollection = containerRef.current.contains(document.activeElement)

      // Don't handle if user is typing
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Don't handle if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return
      }

      // If focus outside, ArrowDown focuses first item
      if (!focusInCollection) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const streams = getStreams()
          if (streams.length > 0) {
            const items = getStreamItems(streams[0])
            if (items.length > 0) {
              const firstId = items[0].getAttribute('data-item-id')
              if (firstId) focusItem(firstId)
            }
          }
        }
        return
      }

      // Handle navigation when focus is within collection
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          handleNavigation('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handleNavigation('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleNavigation('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNavigation('right')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef, handleNavigation, getStreams, getStreamItems, focusItem])

  // Track focus changes
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const handleFocusIn = (e: FocusEvent) => {
      if (isNavigating.current) return

      const target = e.target as HTMLElement
      const itemElement = target.closest('[data-item-id]')

      if (itemElement) {
        const id = itemElement.getAttribute('data-item-id')
        if (id) lastFocusedId.current = id
      }
    }

    const container = containerRef.current
    container.addEventListener('focusin', handleFocusIn)
    return () => container.removeEventListener('focusin', handleFocusIn)
  }, [isActive, containerRef])

  return {
    focusItem,
    lastFocusedId: lastFocusedId.current
  }
}
