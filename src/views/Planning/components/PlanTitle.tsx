import { useRef } from 'react'
import { useYObserver } from '@/hooks'
import { Input } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Awareness } from '@/components'
import type * as Y from 'yjs'

export const PlanTitle = ({ yMap, className }: { yMap?: Y.Map<unknown>, className?: string }): JSX.Element | null => {
  const [title, setTitle] = useYObserver(yMap, 'title')

  const setFocused = useRef<(value: boolean) => void>(null)

  return (
    <Awareness name='PlanTitle' ref={setFocused}>
      <Input
        value={title }
        className={cn('font-medium text-sm border-0', className)}
        onFocus={() => {
          if (setFocused.current) {
            setFocused.current(true)
          }
        }}
        onBlur={() => {
          if (setFocused.current) {
            setFocused.current(false)
          }
        }}
        onChange={(event) => setTitle(event.target.value)}
      />
    </Awareness>
  )
}
