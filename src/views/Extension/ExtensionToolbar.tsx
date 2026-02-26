import { useEffect, useRef, useState, useCallback, type JSX } from 'react'
import {
  Button,
  Tooltip,
  Separator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@ttab/elephant-ui'
import { EllipsisIcon } from '@ttab/elephant-ui/icons'

export interface ExtensionButton {
  kind: 'button'
  name: string
  title?: string
  iconUrl?: string
  disabled?: boolean
  active?: boolean
}

export interface ExtensionSeparator {
  kind: 'separator'
}

export type ToolbarItem = ExtensionButton | ExtensionSeparator

interface ExtensionToolbarProps {
  items: ToolbarItem[]
  locked: boolean
  onButtonClick: (name: string) => void
}

const OVERFLOW_TRIGGER_WIDTH = 40

export const ExtensionToolbar = ({ items, locked, onButtonClick }: ExtensionToolbarProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)

  const recalculate = useCallback(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure || items.length === 0) {
      setVisibleCount(0)
      return
    }

    const available = container.clientWidth
    const children = Array.from(measure.children) as HTMLElement[]
    const baseLeft = measure.offsetLeft

    // Check if everything fits without an overflow trigger
    const last = children[children.length - 1]
    if (last.offsetLeft - baseLeft + last.offsetWidth <= available) {
      setVisibleCount(items.length)
      return
    }

    // Build groups split by separators. Each separator starts a new group
    // together with the buttons that follow it, so entire visual sections
    // move to the overflow dropdown as a unit.
    const groups: number[][] = []
    let current: number[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'separator' && current.length > 0) {
        groups.push(current)
        current = [i]
      } else {
        current.push(i)
      }
    }
    if (current.length > 0) {
      groups.push(current)
    }

    // Find how many complete groups fit (reserving space for the trigger)
    let visibleEnd = 0
    for (const group of groups) {
      const lastIdx = group[group.length - 1]
      const right = children[lastIdx].offsetLeft - baseLeft + children[lastIdx].offsetWidth

      if (right > available - OVERFLOW_TRIGGER_WIDTH) {
        break
      }
      visibleEnd = lastIdx + 1
    }

    setVisibleCount(visibleEnd)
  }, [items])

  useEffect(() => {
    recalculate()

    const el = containerRef.current
    if (!el) {
      return
    }

    const observer = new ResizeObserver(recalculate)
    observer.observe(el)
    return () => observer.disconnect()
  }, [recalculate])

  if (items.length === 0) {
    return <div ref={containerRef} className='flex-1 min-w-0' />
  }

  const visible = items.slice(0, visibleCount)
  const overflowed = items.slice(visibleCount)

  return (
    <div ref={containerRef} className='flex-1 min-w-0 relative overflow-hidden'>
      {/* Hidden measurement row — always renders all items so we can measure their actual widths */}
      <div ref={measureRef} className='flex items-center gap-1 w-max invisible absolute top-0 left-0 pointer-events-none'>
        {items.map((item, i) => (
          <MeasureItem key={item.kind === 'button' ? item.name : `m-sep-${i}`} item={item} />
        ))}
      </div>

      {/* Visible row — only items that fit, plus overflow dropdown */}
      <div className='flex items-center gap-1 w-max'>
        {visible.map((item, i) => (
          <ToolbarItemView
            key={item.kind === 'button' ? item.name : `sep-${i}`}
            item={item}
            locked={locked}
            onButtonClick={onButtonClick}
          />
        ))}

        {overflowed.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <EllipsisIcon className='size-4' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              {overflowed.map((item, i) => {
                if (item.kind === 'separator') {
                  return i === 0 ? null : <DropdownMenuSeparator key={`sep-${i}`} />
                }

                const isDisabled = !!item.disabled

                return (
                  <DropdownMenuItem
                    key={item.name}
                    disabled={isDisabled}
                    className={item.active ? 'bg-accent' : ''}
                    onClick={() => !locked && onButtonClick(item.name)}
                  >
                    {item.iconUrl && (
                      <img
                        src={item.iconUrl}
                        alt=''
                        className='size-4 mr-2 dark:invert'
                      />
                    )}
                    <span>{item.title || item.name}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function MeasureItem({ item }: { item: ToolbarItem }): JSX.Element {
  if (item.kind === 'separator') {
    return <Separator orientation='vertical' className='h-5 mx-1' />
  }

  return (
    <Button variant='ghost' size='sm' tabIndex={-1} aria-hidden>
      {item.iconUrl && (
        <img src={item.iconUrl} alt='' className='size-4' />
      )}
    </Button>
  )
}

function ToolbarItemView({ item, locked, onButtonClick }: {
  item: ToolbarItem
  locked: boolean
  onButtonClick: (name: string) => void
}): JSX.Element {
  if (item.kind === 'separator') {
    return <Separator orientation='vertical' className='h-5 mx-1' />
  }

  const isDisabled = !!item.disabled

  return (
    <Tooltip content={item.title || item.name}>
      <Button
        variant='ghost'
        size='sm'
        disabled={isDisabled}
        className={item.active ? 'bg-accent' : ''}
        onClick={() => !locked && onButtonClick(item.name)}
      >
        {item.iconUrl && (
          <img
            src={item.iconUrl}
            alt=''
            className='size-4 dark:invert'
          />
        )}
      </Button>
    </Tooltip>
  )
}
