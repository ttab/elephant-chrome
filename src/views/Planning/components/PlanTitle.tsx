import { useRef } from 'react'
import { Input } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Awareness } from '@/components'
import { useYObserver } from '@/hooks'

export const PlanTitle = ({ className }: { className?: string }): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', 'root')

  const setFocused = useRef<(value: boolean) => void>(null)

  return !loading
    ? (
      <Awareness name='PlanTitle' ref={setFocused}>
        <Input
          value={get('title') as string}
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
          onChange={(event) => set(event.target.value, 'title')}
      />
      </Awareness>
      )
    : undefined
}
