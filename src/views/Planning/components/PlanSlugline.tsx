import { useState, useRef } from 'react'
import { Button, Input } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { useYObserver } from '@/hooks'

interface SluglineButtonProps {
  value: string
  setActive: (value: boolean) => void
}

interface SluglineInputProps extends SluglineButtonProps {
  setSlugline: (value: string, key: string) => void
}

const SluglineButton = ({ value, setActive }: SluglineButtonProps): JSX.Element => (
  <Button
    className='text-muted-foreground h-7 p-1.5'
    variant='outline'
    onClick={() => setActive(true)}
  >
    {value || 'Slugline...'}
  </Button>
)

const SluglineInput = ({ value, setActive, setSlugline }: SluglineInputProps): JSX.Element => (
  <Input
    value={value}
    autoFocus
    onBlur={() => setActive(false)}
    onChange={(event) => setSlugline(event.target.value, 'value')}
    className='h-[1.2rem] w-44'
  />
)

export const PlanSlugline = ({ path = 'meta.tt/slugline[0]' }: { path?: string }): JSX.Element | undefined => {
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
    : undefined
}
