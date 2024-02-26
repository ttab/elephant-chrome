import { useRef } from 'react'
import { Input } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { useYObserver } from '@/hooks'

// Temp to show slug, show be other component
export const PlanSlugline = (): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('meta.tt/slugline[0]')

  const setFocused = useRef<(value: boolean) => void>(null)

  return !loading
    ? (
      <Awareness name='PlanSlugline' ref={setFocused}>
        <Input
          value={get('value') as string}
          className='font-medium text-sm border-0'
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
          onChange={(event) => set(event.target.value, 'value')}
      />
      </Awareness>
      )
    : undefined
}
