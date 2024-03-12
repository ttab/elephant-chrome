import { useRef, useState, useEffect } from 'react'
import { Input } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Awareness } from '@/components'
import { useYObserver } from '@/hooks'

// TODO: Temp should use Textbit instead of input
export const PlanTitle = ({ className }: { className?: string }): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', 'root')
  const [inputWidth, setInputWidth] = useState<string>()

  const setFocused = useRef<(value: boolean) => void>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (measureRef.current) {
      const { width } = measureRef.current.getBoundingClientRect()
      setInputWidth(width + 'px')
    }
  }, [])

  const syncedClassNames = cn('font-medium text-sm border-0', className)
  return !loading
    ? (
      <Awareness name='PlanTitle' ref={setFocused}>
        <span className={cn(syncedClassNames, 'flex h-0 overflow-y-hidden w-fit')} ref={measureRef}>
          {get('title') as string}
        </span>
        <Input
          value={get('title') as string}
          className={syncedClassNames}
          style={{ width: inputWidth }}
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
          onChange={(event) => {
            const { width } = measureRef.current?.getBoundingClientRect() || {}
            setInputWidth(`${width}px`)
            set(event.target.value, 'title')
          }}
          />
      </Awareness>
      )
    : undefined
}
