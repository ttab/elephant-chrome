import { useState, useRef } from 'react'
import { Awareness } from '@/components'
import { TextBox } from '../ui'
import { SluglineButton } from './Slugline'

export const SluglineEditable = ({ path = 'tt/slugline[0]' }: { path?: string }): JSX.Element => {
  const [active, setActive] = useState(false)
  const setFocused = useRef<(value: boolean) => void>(null)

  return (
    <Awareness name='PlanSlugline' ref={setFocused}>
      {active
        ? <SluglineInput path={path} setActive={setActive} />
        : <SluglineButton path={path} setActive={setActive} />}
    </Awareness>
  )
}

// FIXME: Should call setActive(false) onBlur
// FIXME: Should auto focus on first render
// FIXME: Should blend in, have better styling
const SluglineInput = ({ path, setActive }: {
  path: string
  setActive: (value: boolean) => void
}): JSX.Element => {
  return <TextBox
    base='meta'
    path={path}
    field='value'
    placeholder='Slug'
    // onBlur={() => { setActive(false) }}
    className="h-7 w-44 p-1.5 font-normal text-sm whitespace-nowrap" />
}
