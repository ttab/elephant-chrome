import { Toggle } from '@ttab/elephant-ui'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/modules/yjs/hooks'
import { FastForwardIcon } from 'lucide-react'
import { ENABLE_HAST } from '@/defaults/hast-tmp-flag'
import type * as Y from 'yjs'
import type { JSX } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

export const HastToggle = ({ ele, usableId, className }: {
  ele: Y.Map<unknown>
  usableId?: bigint
  className?: string
}): JSX.Element | null => {
  const [hast, setHast] = useYValue<Block | undefined>(ele, 'meta.ntb/hast[0]')
  const isHast = !!hast

  if (!ENABLE_HAST) {
    return null
  }

  const handleToggle = (pressed: boolean) => {
    if (pressed) {
      const nextId = (usableId ?? 0n) + 1n
      setHast(Block.create({
        type: 'ntb/hast',
        data: { value: String(nextId) }
      }))
    } else {
      setHast(undefined)
    }
  }

  return (
    <Toggle
      size='sm'
      pressed={isHast}
      onPressedChange={handleToggle}
      aria-label='Hast'
      className={cn('gap-1.5 text-muted-foreground', className)}
      variant='outline'
    >
      <FastForwardIcon
        size={15}
        strokeWidth={1.75}
        className={cn(isHast && 'text-red-600')}
      />
      Hast
    </Toggle>
  )
}
