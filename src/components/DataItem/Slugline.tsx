import { useState, useRef, useEffect, createRef } from 'react'
import { Button, Input } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { useYObserver } from '@/hooks'

interface SluglineButtonProps {
  value: string
  setActive?: (value: boolean) => void
}

interface SluglineInputProps extends SluglineButtonProps {
  setSlugline: (value: string, key: string) => void
}

export const SluglineButton = ({ value, setActive }: SluglineButtonProps): JSX.Element => (
  <Button
    className='text-muted-foreground h-7 p-1.5 font-normal text-sm whitespace-nowrap'
    variant='outline'
    onClick={() => setActive && setActive(true)}
  >
    {value || 'Slugline...'}
  </Button>
)

const SluglineInput = ({ value, setActive, setSlugline }: SluglineInputProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        inputRef.current?.blur()
      }
    })
  })

  return <Input
    ref={inputRef}
    value={value}
    autoFocus
    onBlur={() => setActive && setActive(false)}
    onChange={(event) => setSlugline(event.target.value, 'value')}
    className='h-7 w-44 font-normal text-sm whitespace-nowrap'
  />
}

export const SluglineEditable = ({ path = 'meta.tt/slugline[0]' }: { path?: string }): JSX.Element => {
  const [active, setActive] = useState(false)
  const { get, set, loading } = useYObserver('planning', path)


  const setFocused = useRef<(value: boolean) => void>(null)

  return !loading
    ? (
      <Awareness name='PlanSlugline' ref={setFocused}>
        {active
          ? <SluglineInput
              value={get('value') as string}
              setActive={setActive}
              setSlugline={set} />
          : <SluglineButton
              value={get('value') as string}
              setActive={setActive} />
        }
      </Awareness>
      )
    : <p>Loading...</p>
}
