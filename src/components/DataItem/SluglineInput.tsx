import { useState, useRef, useCallback } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { SluglineButton } from './Slugline'

export const SluglineEditable = ({ path = 'tt/slugline[0]' }: { path?: string }): JSX.Element => {
  const [active, setActive] = useState(false)
  const setFocused = useRef<(value: boolean) => void>(null)

  const setAwareness = useCallback((active: boolean) => {
    if (setFocused?.current) {
      setFocused.current(active)
      setActive(active)
    }
  }, [setActive, setFocused])

  return (
    <Awareness name={`PlanSlugline-${path}`} ref={setFocused}>
      {active
        ? <SluglineInput path={path} setActive={setAwareness} />
        : <SluglineButton path={path} setActive={setAwareness} />}
    </Awareness>
  )
}

// FIXME: Should blend in, have better styling
const SluglineInput = ({ path, setActive }: {
  path: string
  setActive: ((value: boolean) => void)
}): JSX.Element => {
  return <TextBox
    base='meta'
    path={path}
    field='value'
    placeholder='Slug'
    autoFocus={true}
    onBlur={() => {
      if (setActive) {
        setActive(false)
      }
    }}
    className="h-7 w-44 p-1.5 font-normal text-sm whitespace-nowrap" />
}
