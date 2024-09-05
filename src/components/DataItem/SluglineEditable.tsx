import { useState, useRef, useCallback } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { SluglineButton } from './Slugline'
import { useYValue } from '@/hooks/useYValue'
import type * as Y from 'yjs'

export const SluglineEditable = ({ path }: {
  path: string
}): JSX.Element => {
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
        : <div className="pt-1.5"><SluglineButton path={path} setActive={setAwareness} /></div>}
    </Awareness>
  )
}

const SluglineInput = ({ path, setActive }: {
  path: string
  setActive: ((value: boolean) => void)
}): JSX.Element => {
  const [slugLine] = useYValue<Y.XmlText | undefined>(path)


  if (typeof slugLine === 'undefined') {
    return <></>
  }

  return <TextBox
    path={path}
    placeholder='Lägg till slugg'
    autoFocus={true}
    singleLine={true}
    onBlur={() => {
      if (setActive) {
        setActive(false)
      }
    }}
    className="h-7 w-44 p-1.5 font-normal text-sm whitespace-nowrap"
  />
}
